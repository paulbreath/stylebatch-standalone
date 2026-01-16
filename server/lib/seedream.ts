/**
 * Volcengine Seedream 4.5 API Integration
 * 
 * 使用火山引擎方舟平台的 Seedream 4.5 模型进行图像生成
 * 
 * 文档: https://www.volcengine.com/docs/82379/1541523
 * 定价: ¥0.25/张
 */

import { env } from "../_core/env";

const SEEDREAM_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const SEEDREAM_ENDPOINT_ID = "ep-20260116122351-2tlgl";
const SEEDREAM_COST_PER_IMAGE = 0.25; // ¥0.25/张

interface SeedreamRequest {
  model: string;
  prompt: string;
  image?: string;
  size?: string;
  n?: number;
  response_format?: "url" | "b64_json";
  sequential_image_generation?: "auto" | "disabled";
}

interface SeedreamResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

/**
 * 调用 Seedream API 进行图生图转换
 */
export async function convertWithSeedream(params: {
  imageUrl: string;
  prompt: string;
  size?: string;
}): Promise<string> {
  const apiKey = env.volcengineArkApiKey;
  if (!apiKey) {
    throw new Error("VOLCENGINE_ARK_API_KEY is not configured");
  }

  const requestBody: SeedreamRequest = {
    model: SEEDREAM_ENDPOINT_ID,
    prompt: params.prompt,
    image: params.imageUrl,
    size: params.size || "4K",
    n: 1,
    response_format: "url",
    sequential_image_generation: "disabled",
  };

  console.log("[Seedream] Request:", {
    model: requestBody.model,
    prompt: requestBody.prompt.substring(0, 100),
    imageUrl: params.imageUrl.substring(0, 50),
  });

  const response = await fetch(SEEDREAM_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Seedream] API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });
    throw new Error(
      `Seedream API error: HTTP ${response.status}: ${errorText}`
    );
  }

  const result: SeedreamResponse = await response.json();
  console.log("[Seedream] Response:", {
    created: result.created,
    dataCount: result.data.length,
  });

  if (!result.data || result.data.length === 0 || !result.data[0].url) {
    throw new Error("Seedream API returned no image URL");
  }

  const imageUrl = result.data[0].url;
  console.log("[Seedream] Generated image URL:", imageUrl.substring(0, 100));

  return imageUrl;
}

/**
 * 获取 Seedream 转换成本
 */
export function getSeedreamCost(): number {
  return SEEDREAM_COST_PER_IMAGE;
}
