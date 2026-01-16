/**
 * Replicate API SDK
 * 使用 Nano Banana (Gemini 2.5 Flash Image) 模型进行图像风格转换
 */

import Replicate from 'replicate';
import { env } from '../_core/env';

// 初始化 Replicate 客户端
let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    if (!env.replicateApiToken) {
      throw new Error('REPLICATE_API_TOKEN is not configured');
    }
    replicateClient = new Replicate({
      auth: env.replicateApiToken,
    });
  }
  return replicateClient;
}

/**
 * 检查 Replicate API 是否可用
 */
export function isReplicateAvailable(): boolean {
  return Boolean(env.replicateApiToken);
}

/**
 * 风格提示词映射
 * 将预设风格映射到 Replicate 的 prompt
 */
export const REPLICATE_STYLE_PROMPTS: Record<string, string> = {
  // 3D 和卡通风格
  '3d_render': '3D rendered style, smooth surfaces, vibrant colors, Pixar-like quality',
  'disney_3d': 'Disney 3D animation style, colorful, expressive characters',
  'pixar_3d': 'Pixar 3D animation style, detailed textures, warm lighting',
  
  // 动漫风格
  'anime': 'anime style, bold lines, expressive features, vibrant colors',
  'ghibli': 'Studio Ghibli anime style, hand-drawn look, soft colors, dreamy atmosphere',
  'makoto_shinkai': 'Makoto Shinkai anime style, detailed backgrounds, beautiful lighting',
  
  // 卡通风格
  'cartoon': 'cartoon style, simplified shapes, bright colors, playful',
  'comic': 'comic book style, bold outlines, dramatic shading, pop art',
  
  // 水彩和水墨
  'watercolor': 'watercolor painting style, soft colors, flowing textures, artistic',
  'ink_painting': 'traditional ink painting style, monochrome, brush strokes',
  'chinese_ink': 'Chinese ink wash painting style, minimalist, elegant',
  
  // 特殊风格
  'clay': 'cute clay sculpture style, soft shapes, pastel colors',
  'pixel_art': 'pixel art style, retro gaming aesthetic, 8-bit colors',
  
  // 写实风格
  'realistic': 'photorealistic style, detailed textures, natural lighting',
  'photorealistic': 'ultra-realistic photography style, high detail, professional',
  
  // 其他风格
  'oil_painting': 'oil painting style, thick brush strokes, rich colors',
  'sketch': 'pencil sketch style, hand-drawn lines, artistic',
  'cyberpunk': 'cyberpunk style, neon lights, futuristic, dark atmosphere',
  'fantasy': 'fantasy art style, magical, ethereal, vibrant colors',
};

export interface ReplicateConversionOptions {
  imageUrl: string;
  style?: string;
  prompt?: string;
  strength?: number;
  steps?: number;
}

export interface ReplicateConversionResult {
  success: boolean;
  imageUrl?: string;
  cost: number;
  error?: string;
}

/**
 * 使用 Replicate FLUX img2img 转换图片
 */
export async function convertImageWithReplicate(
  options: ReplicateConversionOptions
): Promise<ReplicateConversionResult> {
  try {
    const client = getReplicateClient();
    
    // 获取风格提示词
    const prompt = options.prompt || 
      (options.style ? REPLICATE_STYLE_PROMPTS[options.style] : undefined) ||
      'transform the image while preserving its main content';
    
    // 调用 Replicate API - 使用 Nano Banana (Gemini 2.5 Flash Image) 模型
    const output = await client.run(
      "google/nano-banana",
      {
        input: {
          prompt: prompt,
          image_input: [options.imageUrl], // Nano Banana 使用 image_input 代替 input_images
          aspect_ratio: "match_input_image",
          output_format: "jpg",
        }
      }
    );
    
    // 输出详细日志查看返回格式
    console.log('[Replicate] Raw output type:', typeof output);
    console.log('[Replicate] Is array:', Array.isArray(output));
    console.log('[Replicate] Has .url() method:', output && typeof (output as any).url === 'function');
    
    // FLUX 2 Dev 返回 FileOutput 对象或数组
    let resultUrl: string | undefined;
    
    // 处理 FileOutput 对象（有 .url() 方法）
    if (output && typeof (output as any).url === 'function') {
      const urlObj = (output as any).url();
      // .url() 返回的是 URL 对象，需要转换为字符串
      resultUrl = typeof urlObj === 'string' ? urlObj : urlObj.toString();
      console.log('[Replicate] Extracted URL from FileOutput:', resultUrl);
    }
    // 处理 FileOutput 数组
    else if (Array.isArray(output) && output.length > 0) {
      const firstOutput = output[0];
      if (firstOutput && typeof firstOutput.url === 'function') {
        const urlObj = firstOutput.url();
        resultUrl = typeof urlObj === 'string' ? urlObj : urlObj.toString();
        console.log('[Replicate] Extracted URL from FileOutput array:', resultUrl);
      } else if (typeof firstOutput === 'string') {
        resultUrl = firstOutput;
        console.log('[Replicate] Extracted URL from string array:', resultUrl);
      }
    }
    // 处理普通字符串
    else if (typeof output === 'string') {
      resultUrl = output;
      console.log('[Replicate] Direct string URL:', resultUrl);
    }
    // 处理普通对象
    else if (output && typeof output === 'object') {
      const obj = output as any;
      resultUrl = obj.url || obj.image || obj.output;
      console.log('[Replicate] Extracted URL from object:', resultUrl);
    }
    
    if (!resultUrl || typeof resultUrl !== 'string') {
      console.error('[Replicate] Failed to extract URL. Output:', JSON.stringify(output, null, 2));
      throw new Error(`Invalid output from Replicate API: unable to extract URL`);
    }
    
    return {
      success: true,
      imageUrl: resultUrl,
      cost: 0.28, // Nano Banana: $0.039 ≈ ¥0.28
    };
  } catch (error: any) {
    console.error('[Replicate] Conversion failed:', error);
    return {
      success: false,
      cost: 0,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * 获取支持的风格列表
 */
export function getSupportedStyles(): string[] {
  return Object.keys(REPLICATE_STYLE_PROMPTS);
}
