/**
 * Gemini API 集成模块
 * 提供图像分析和风格转换功能
 */

import { ENV } from "./_core/env";
import { storagePut } from "./storage";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * 将任意宽高比转换为 Imagen 4.0 支持的最接近宽高比
 * 支持的宽高比: 1:1, 9:16, 16:9, 4:3, 3:4
 */
function getClosestAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  
  // 定义支持的宽高比
  const supportedRatios = [
    { name: "1:1", value: 1.0 },
    { name: "4:3", value: 4/3 },
    { name: "3:4", value: 3/4 },
    { name: "16:9", value: 16/9 },
    { name: "9:16", value: 9/16 },
  ];
  
  // 找到最接近的宽高比
  let closest = supportedRatios[0];
  let minDiff = Math.abs(ratio - closest.value);
  
  for (const supported of supportedRatios) {
    const diff = Math.abs(ratio - supported.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = supported;
    }
  }
  
  console.log(`[Gemini] Original aspect ratio: ${width}:${height} (${ratio.toFixed(2)}), using closest: ${closest.name}`);
  return closest.name;
}

if (!GEMINI_API_KEY) {
  console.warn("[Gemini] API Key not configured");
}

/**
 * 图像分析结果
 */
export interface ImageAnalysis {
  subject: string; // 主体
  composition: string; // 构图
  colors: string; // 色彩
  lighting: string; // 光线
  style: string; // 风格
}

/**
 * 风格转换结果
 */
export interface StyleConversionResult {
  imageUrl: string; // 生成的图片 URL
  mimeType: string; // MIME 类型
}

/**
 * 分析图片
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key not configured");
  }

  // 下载图片并转换为 base64
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }
  
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  
  // 获取 MIME 类型
  const contentType = imageResponse.headers.get("content-type") || "image/jpeg";

  const prompt = `请详细分析这张图片，按以下格式输出（每项一行，不要使用markdown格式）：
主体: [描述图片的主要内容和对象]
构图: [描述构图方式、视角、景深等]
色彩: [描述主色调、配色方案、饱和度等]
光线: [描述光源、明暗、氛围等]
风格: [描述整体艺术风格]`;

  const response = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
              {
                inline_data: {
                  mime_type: contentType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // 解析返回的文本
  const lines = text.split("\n").filter((line: string) => line.trim());
  const analysis: any = {};

  for (const line of lines) {
    const match = line.match(/^([^:：]+)[：:]\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      
      if (key.includes("主体")) analysis.subject = value;
      else if (key.includes("构图")) analysis.composition = value;
      else if (key.includes("色彩")) analysis.colors = value;
      else if (key.includes("光线")) analysis.lighting = value;
      else if (key.includes("风格")) analysis.style = value;
    }
  }

  return {
    subject: analysis.subject || "未识别",
    composition: analysis.composition || "未识别",
    colors: analysis.colors || "未识别",
    lighting: analysis.lighting || "未识别",
    style: analysis.style || "未识别",
  };
}

/**
 * 转换图片风格
 * 使用两步法：
 * 1. 使用 Gemini 分析原图并生成新风格的描述
 * 2. 使用 Gemini Imagen 3.0 根据描述生成新图片
 */
/**
 * 分析参考图的风格特征
 */
export async function analyzeReferenceStyle(
  referenceImageUrl: string,
  additionalPrompt?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key not configured");
  }

  // 下载参考图
  const response = await fetch(referenceImageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch reference image: ${response.statusText}`);
  }
  const imageBuffer = await response.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString("base64");
  const contentType = response.headers.get("content-type") || "image/jpeg";

  let prompt = `Analyze this image and describe its artistic style in detail. Focus on:
1. Art style and technique (e.g., oil painting, watercolor, digital art, photography)
2. Color palette and color treatment
3. Brushwork, texture, and visual effects
4. Lighting and atmosphere
5. Composition and perspective
6. Any distinctive artistic characteristics

Provide a comprehensive style description that can be used to recreate this style on other images.`;

  // 如果有额外提示词，添加到 prompt 中
  if (additionalPrompt && additionalPrompt.trim()) {
    prompt += `\n\nAdditional style requirements: ${additionalPrompt.trim()}`;
  }

  // 调用 Gemini API
  const apiResponse = await fetch(
    `${GEMINI_API_BASE}/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: contentType,
                  data: base64Image,
                },
              },
              { text: prompt },
            ],
          },
        ],
      }),
    }
  );

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(`Gemini API error: ${apiResponse.status} ${errorText}`);
  }

  const result = await apiResponse.json();
  const styleDescription = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  if (!styleDescription) {
    throw new Error("Failed to analyze reference style");
  }

  console.log("[Gemini] Reference style analysis:", styleDescription);
  return styleDescription;
}

export async function convertImageStyle(
  originalImageUrl: string,
  styleDescription: string,
  strength: number = 0.75,
  analyzeFirst: boolean = false,
  preserveTransparency: boolean = false,
  targetWidth?: number,
  targetHeight?: number,
  imageSize: '1K' | '2K' = '1K'
): Promise<StyleConversionResult> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API Key not configured");
  }

  let finalPrompt = "";

  if (analyzeFirst) {
    // 先分析原图
    console.log("[Gemini] Analyzing original image...");
    const analysis = await analyzeImage(originalImageUrl);
    
    // 生成详细的图片描述提示词
    finalPrompt = `Create an image with the following characteristics:

Subject and Content: ${analysis.subject}
Composition: ${analysis.composition}
Colors: ${analysis.colors}
Lighting: ${analysis.lighting}

Apply this artistic style: ${styleDescription}

Style strength: ${strength} (0=original, 1=full style transformation)

Generate a high-quality image that combines the original content with the new artistic style.`;
  } else {
    // 不分析原图，直接根据风格描述生成
    finalPrompt = `Create an image in the following artistic style:

${styleDescription}

Style strength: ${strength}

Generate a high-quality, visually appealing image that embodies this style.`;
  }

  console.log("[Gemini] Generating image with Imagen 3.0...");
  console.log("[Gemini] Prompt:", finalPrompt);

  // 使用 Gemini Imagen 4.0 生成图片
  const response = await fetch(
    `${GEMINI_API_BASE}/models/imagen-4.0-generate-001:predict`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: finalPrompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: targetWidth && targetHeight ? getClosestAspectRatio(targetWidth, targetHeight) : "1:1",
          imageSize: imageSize,
          includeRaiReason: false,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Gemini] Image generation failed:", errorText);
    throw new Error(`Gemini Imagen API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log("[Gemini] Imagen API response:", JSON.stringify(result).substring(0, 200));

  // 从响应中提取图片数据
  const imageData = result.predictions?.[0]?.bytesBase64Encoded;
  
  if (!imageData) {
    throw new Error("No image data in Gemini Imagen response");
  }

  // 将 base64 图片数据保存到 S3
  const imageBuffer = Buffer.from(imageData, "base64");
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileKey = `converted/${Date.now()}-${randomSuffix}.png`;
  
  const { url } = await storagePut(fileKey, imageBuffer, "image/png");

  console.log("[Gemini] Image saved to S3:", url);

  return {
    imageUrl: url,
    mimeType: "image/png",
  };
}
