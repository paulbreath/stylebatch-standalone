/**
 * 火山引擎旧版本 API 集成模块（ImageStyleConversion）
 * 仅支持剪纸风和水彩风两种风格
 */

import crypto from "crypto";
import { storagePut } from "./storage";

const VOLCENGINE_ACCESS_KEY = process.env.VOLCENGINE_ACCESS_KEY;
const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY;
const VOLCENGINE_API_BASE = "https://visual.volcengineapi.com";
const VOLCENGINE_REGION = "cn-north-1";
const VOLCENGINE_SERVICE = "cv";

if (!VOLCENGINE_ACCESS_KEY || !VOLCENGINE_SECRET_KEY) {
  console.warn("[Volcengine Legacy] API credentials not configured");
}

/**
 * 旧版本风格映射表
 */
export const LEGACY_STYLE_MAPPING: Record<string, string> = {
  watercolor: "watercolor_cartoon", // 水彩风
  papercut: "jzcartoon", // 剪纸风
};

export interface VolcengineLegacyConversionResult {
  imageUrl: string;
  originalImageUrl: string;
}

/**
 * 生成火山引擎 API 签名（旧版本）
 */
function generateLegacySignature(
  method: string,
  path: string,
  query: Record<string, string>,
  headers: Record<string, string>,
  body: string
): string {
  const timestamp = headers["X-Date"];
  const date = timestamp.substring(0, 8); // YYYYMMDD

  // 1. 构建规范请求
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key.toLowerCase()}:${headers[key]}`)
    .join("\n");

  const signedHeaders = Object.keys(headers)
    .sort()
    .map((key) => key.toLowerCase())
    .join(";");

  const canonicalQueryString = Object.keys(query)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
    .join("&");

  const hashedPayload = crypto.createHash("sha256").update(body).digest("hex");

  const canonicalRequest = [
    method,
    path,
    canonicalQueryString,
    canonicalHeaders,
    "",
    signedHeaders,
    hashedPayload,
  ].join("\n");

  // 2. 构建 String to Sign
  const algorithm = "HMAC-SHA256";
  const credentialScope = `${date}/${VOLCENGINE_REGION}/${VOLCENGINE_SERVICE}/request`;
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");

  const stringToSign = [algorithm, timestamp, credentialScope, hashedCanonicalRequest].join("\n");

  // 3. 计算签名
  const kDate = crypto
    .createHmac("sha256", VOLCENGINE_SECRET_KEY!)
    .update(date)
    .digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(VOLCENGINE_REGION).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(VOLCENGINE_SERVICE).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("request").digest();
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  return `${algorithm} Credential=${VOLCENGINE_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

/**
 * 使用火山引擎旧版本 API 转换图片风格
 */
export async function convertImageStyleWithVolcengineLegacy(
  originalImageUrl: string,
  styleKey: string
): Promise<VolcengineLegacyConversionResult> {
  if (!VOLCENGINE_ACCESS_KEY || !VOLCENGINE_SECRET_KEY) {
    throw new Error("Volcengine API credentials not configured");
  }

  // 获取对应的 type
  const type = LEGACY_STYLE_MAPPING[styleKey];
  if (!type) {
    throw new Error(`Unsupported style for legacy API: ${styleKey}`);
  }

  console.log(`[Volcengine Legacy] Converting image with style: ${styleKey} (type: ${type})`);

  // 构建请求体（application/x-www-form-urlencoded）
  const bodyParams = new URLSearchParams({
    image_url: originalImageUrl,
    type: type,
  });
  const body = bodyParams.toString();

  const method = "POST";
  const path = "/";
  const query = {
    Action: "ImageStyleConversion",
    Version: "2020-08-26",
  };

  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    Host: "visual.volcengineapi.com",
    "X-Date": timestamp,
  };

  // 生成签名
  const authorization = generateLegacySignature(method, path, query, headers, body);

  // 发送请求
  const queryString = Object.keys(query)
    .map((key) => `${key}=${query[key as keyof typeof query]}`)
    .join("&");

  const response = await fetch(`${VOLCENGINE_API_BASE}${path}?${queryString}`, {
    method,
    headers: {
      ...headers,
      Authorization: authorization,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Volcengine Legacy] API error:", errorText);
    throw new Error(`Volcengine Legacy API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("[Volcengine Legacy] API response:", JSON.stringify(result).substring(0, 200));

  // 检查返回结果
  if (result.code !== 10000) {
    throw new Error(`Volcengine Legacy API error: ${result.message}`);
  }

  // 上传转换后的图片到 S3
  const base64Image = result.data.image;
  const imageBuffer = Buffer.from(base64Image, "base64");
  const fileKey = `converted/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { url: imageUrl } = await storagePut(fileKey, imageBuffer, "image/jpeg");

  console.log("[Volcengine Legacy] Image uploaded to S3:", imageUrl);

  return {
    imageUrl,
    originalImageUrl,
  };
}
