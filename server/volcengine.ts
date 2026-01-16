/**
 * 火山引擎 API 集成模块
 * 提供图像风格转换功能（基于图生图技术）
 */

import crypto from "crypto";
import { storagePut } from "./storage";

const VOLCENGINE_ACCESS_KEY = process.env.VOLCENGINE_ACCESS_KEY;
const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY;
const VOLCENGINE_API_BASE = "https://visual.volcengineapi.com";
const VOLCENGINE_REGION = "cn-north-1";
const VOLCENGINE_SERVICE = "cv";

if (!VOLCENGINE_ACCESS_KEY || !VOLCENGINE_SECRET_KEY) {
  console.warn("[Volcengine] API credentials not configured");
}

/**
 * 风格映射表：将我们的预设风格映射到火山引擎的 req_key
 * 根据火山引擎 API 文档更新
 */
export const STYLE_MAPPING: Record<string, string> = {
  // 艺术风格
  watercolor: "img2img_water_paint_style_usage", // 水彩风
  oil_painting: "img2img_water_ink_style_usage", // 油画（使用水墨风代替）
  sketch: "img2img_real_mix_style_usage", // 素描（使用写实风代替）
  ink_wash: "img2img_water_ink_style_usage", // 水墨风 / 国风-水墨
  ukiyo_e: "img2img_ghibli_style_usage", // 浮世绘（使用网红日漫风代替）
  van_gogh: "img2img_water_paint_style_usage", // 梵高（使用水彩风代替）
  picasso: "img2img_comic_style_usage", // 毕加索（使用精致美漫代替）
  
  // 摄影风格
  black_white: "img2img_real_mix_style_usage", // 黑白（写实风）
  vintage: "img2img_real_mix_style_usage", // 复古（写实风）
  cinematic: "img2img_real_mix_style_usage", // 电影感（写实风）
  hdr: "img2img_real_mix_style_usage", // HDR（写实风）
  lomography: "img2img_real_mix_style_usage", // Lomo（写实风）
  
  // 设计风格
  flat_design: "img2img_cartoon_style_usage", // 扁平化（动漫风）
  "3d_render": "img2img-disney_3d_style-usage", // 3D风 / 3D渲染
  pixel_art: "img2img_3d_style_usage", // 像素艺术（使用 3D-游戏_Z时代）
  cyberpunk: "img2img_comic_style_usage", // 赛博朋克（使用赛博机械）
  steampunk: "img2img_comic_style_usage", // 蒸汽朋克（使用精致美漫）
  minimalist: "img2img_cartoon_style_usage", // 极简主义（动漫风）
  
  // 特殊效果
  anime: "img2img_cartoon_style_usage", // 动漫风
  comic: "img2img_ghibli_style_usage", // 漫画（网红日漫风）
  neon: "img2img_blueline_style_usage", // 霞虹（梦幻风）
  glitch: "img2img_comic_style_usage", // 故障艺术（使用精致美漫）
};

/**
 * 火山引擎风格转换结果
 */
export interface VolcengineConversionResult {
  imageUrl: string; // 生成的图片 URL
  mimeType: string; // MIME 类型
}

/**
 * 生成火山引擎 API 签名
 */
function generateSignature(
  method: string,
  path: string,
  query: Record<string, string>,
  headers: Record<string, string>,
  body: string
): string {
  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
  const date = timestamp.substring(0, 8);

  // 1. 构建 Canonical Request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key.toLowerCase()}:${headers[key].trim()}`)
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
 * 使用火山引擎 API 转换图片风格
 */
export async function convertImageStyleWithVolcengine(
  originalImageUrl: string,
  styleKey: string,
  strength: number = 0.75
): Promise<VolcengineConversionResult> {
  if (!VOLCENGINE_ACCESS_KEY || !VOLCENGINE_SECRET_KEY) {
    throw new Error("Volcengine API credentials not configured");
  }

  // 获取对应的 req_key
  const reqKey = STYLE_MAPPING[styleKey];
  if (!reqKey) {
    throw new Error(`Unsupported style: ${styleKey}`);
  }

  console.log(`[Volcengine] Converting image with style: ${styleKey} (req_key: ${reqKey})`);

  // 构建请求体
  const requestBody = {
    req_key: reqKey,
    image_urls: [originalImageUrl],
    return_url: true,
    logo_info: {
      add_logo: false,
      position: 0,
      language: 0,
      opacity: 1,
    },
  };

  const body = JSON.stringify(requestBody);
  const method = "POST";
  const path = "/";
  const query = {
    Action: "CVProcess",
    Version: "2022-08-31",
  };

  const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
  const headers = {
    "Content-Type": "application/json",
    Host: "visual.volcengineapi.com",
    "X-Date": timestamp,
  };

  // 生成签名
  const authorization = generateSignature(method, path, query, headers, body);

  // 发送请求
  const queryString = Object.keys(query)
    .map((key) => `${key}=${encodeURIComponent(query[key as keyof typeof query])}`)
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
    console.error("[Volcengine] API error:", errorText);
    throw new Error(`Volcengine API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("[Volcengine] API response:", JSON.stringify(result).substring(0, 200));

  // 检查响应状态
  if (result.code !== 10000) {
    throw new Error(`Volcengine API error: ${result.message || "Unknown error"}`);
  }

  // 提取图片数据
  const imageUrl = result.data?.image_urls?.[0];
  const imageBase64 = result.data?.binary_data_base64?.[0];

  if (!imageUrl && !imageBase64) {
    throw new Error("No image data in Volcengine response");
  }

  // 如果返回的是 URL，直接使用
  if (imageUrl) {
    console.log("[Volcengine] Image URL:", imageUrl);
    return {
      imageUrl,
      mimeType: "image/png",
    };
  }

  // 如果返回的是 base64，保存到 S3
  if (imageBase64) {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `converted/${Date.now()}-${randomSuffix}.png`;

    const { url } = await storagePut(fileKey, imageBuffer, "image/png");
    console.log("[Volcengine] Image saved to S3:", url);

    return {
      imageUrl: url,
      mimeType: "image/png",
    };
  }

  throw new Error("Failed to process Volcengine response");
}
