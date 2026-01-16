/**
 * 火山引擎 API 集成模块（使用官方 SDK）
 * 支持新版本 CVProcess API（25种风格）
 */

import { Signer } from "@volcengine/openapi";
import { storagePut } from "./storage";

const VOLCENGINE_ACCESS_KEY = process.env.VOLCENGINE_ACCESS_KEY;
const VOLCENGINE_SECRET_KEY = process.env.VOLCENGINE_SECRET_KEY;
const VOLCENGINE_API_BASE = "https://visual.volcengineapi.com";
const VOLCENGINE_REGION = "cn-north-1";
const VOLCENGINE_SERVICE = "cv";

if (!VOLCENGINE_ACCESS_KEY || !VOLCENGINE_SECRET_KEY) {
  console.warn("[Volcengine SDK] API credentials not configured");
}

/**
 * 风格映射表：将我们的预设风格映射到火山引擎的 req_key
 */
export const SDK_STYLE_MAPPING: Record<string, string> = {
  // 艺术风格
  watercolor: "img2img_water_paint_style_usage", // 水彩风
  oil_painting: "img2img_water_ink_style_usage", // 油画（使用水墨风代替）
  sketch: "img2img_real_mix_style_usage", // 素描（使用写实风代替）
  ink_wash: "img2img_water_ink_style_usage", // 水墨风 / 国风-水墨
  ukiyo_e: "img2img_ghibli_style_usage", // 浮世绘（使用网红日漫风代替）
  van_gogh: "img2img_water_paint_style_usage", // 梵高（使用水彩风代替）

  // 动漫风格
  anime: "img2img_ghibli_style_usage", // 动漫 / 网红日漫风
  cartoon: "img2img_3d_cartoon_style_usage", // 卡通 / 3D卡通风
  comic: "img2img_ghibli_style_usage", // 漫画（使用网红日漫风代替）
  chibi: "img2img_3d_cartoon_style_usage", // Q版（使用3D卡通风代替）

  // 3D 风格
  "3d_render": "img2img_3d_cartoon_style_usage", // 3D渲染 / 3D卡通风
  low_poly: "img2img_3d_cartoon_style_usage", // 低多边形（使用3D卡通风代替）
  clay: "img2img_3d_cartoon_style_usage", // 粘土（使用3D卡通风代替）

  // 特殊效果
  pixel_art: "img2img_pixel_style_usage", // 像素风
  sticker: "img2img_sticker_style_usage", // 贴纸风
  neon: "img2img_real_mix_style_usage", // 霓虹（使用写实风代替）
  cyberpunk: "img2img_real_mix_style_usage", // 赛博朋克（使用写实风代替）

  // 摄影风格
  portrait: "img2img_real_mix_style_usage", // 肖像 / 写实风
  landscape: "img2img_real_mix_style_usage", // 风景（使用写实风代替）
  black_and_white: "img2img_real_mix_style_usage", // 黑白（使用写实风代替）
  vintage: "img2img_real_mix_style_usage", // 复古（使用写实风代替）

  // 其他
  minimalist: "img2img_real_mix_style_usage", // 极简主义（使用写实风代替）
  abstract: "img2img_water_paint_style_usage", // 抽象（使用水彩风代替）
};

export interface VolcengineSDKConversionResult {
  imageUrl: string;
  originalImageUrl: string;
}

/**
 * 使用火山引擎官方 SDK 转换图片风格
 */
export async function convertImageStyleWithVolcengineSDK(
  originalImageUrl: string,
  styleKey: string,
  strength: number = 0.5
): Promise<VolcengineSDKConversionResult> {
  if (!VOLCENGINE_ACCESS_KEY || !VOLCENGINE_SECRET_KEY) {
    throw new Error("Volcengine API credentials not configured");
  }

  // 获取对应的 req_key
  const reqKey = SDK_STYLE_MAPPING[styleKey];
  if (!reqKey) {
    throw new Error(`Unsupported style: ${styleKey}`);
  }

  console.log(`[Volcengine SDK] Converting image with style: ${styleKey} (req_key: ${reqKey})`);

  // 构建请求体
  const requestBody = {
    req_key: reqKey,
    image_urls: [originalImageUrl],
    strength: strength,
  };

  const method = "POST";
  const path = "/";
  const query = {
    Action: "CVProcess",
    Version: "2022-08-31",
  };

  // 使用官方 SDK 的 Signer 进行签名
  const signer = new Signer(
    {
      region: VOLCENGINE_REGION,
      method,
      pathname: path,
      params: query,
      headers: {
        "Content-Type": "application/json",
        Host: "visual.volcengineapi.com",
      },
      body: JSON.stringify(requestBody),
    },
    VOLCENGINE_SERVICE
  );

  // 添加签名
  signer.addAuthorization({
    accessKeyId: VOLCENGINE_ACCESS_KEY,
    secretKey: VOLCENGINE_SECRET_KEY,
  });

  // 获取签名后的请求对象
  const signedRequest = signer.request;

  // 构建查询字符串
  const queryString = Object.keys(query)
    .map((key) => `${key}=${query[key as keyof typeof query]}`)
    .join("&");

  // 发送请求
  const response = await fetch(`${VOLCENGINE_API_BASE}${path}?${queryString}`, {
    method,
    headers: signedRequest.headers as Record<string, string>,
    body: signedRequest.body as string,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Volcengine SDK] API error:", errorText);
    throw new Error(`Volcengine SDK API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("[Volcengine SDK] API response:", JSON.stringify(result).substring(0, 200));

  // 检查返回结果
  if (result.code !== 10000) {
    throw new Error(`Volcengine SDK API error: ${result.message}`);
  }

  // 获取转换后的图片 URL
  const convertedImageUrl = result.data.image_urls[0];

  // 下载并上传到 S3
  const imageResponse = await fetch(convertedImageUrl);
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const fileKey = `converted/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { url: imageUrl } = await storagePut(fileKey, imageBuffer, "image/jpeg");

  console.log("[Volcengine SDK] Image uploaded to S3:", imageUrl);

  return {
    imageUrl,
    originalImageUrl,
  };
}
