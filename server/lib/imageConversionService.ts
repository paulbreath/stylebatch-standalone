/**
 * 统一的图像转换服务
 * 优先使用火山引擎 API，失败时自动切换到 Gemini API
 */

import { convertImageWithVolcengine, VOLCENGINE_STYLE_MAP, isVolcengineAvailable } from './volcengine_official';
import { convertImageStyle } from '../gemini';
import { convertImageWithReplicate, REPLICATE_STYLE_PROMPTS, isReplicateAvailable } from './replicate';
import { convertWithSeedream, getSeedreamCost } from './seedream';

export interface ConversionOptions {
  imageUrl: string;
  imageBase64?: string;
  stylePreset?: string;
  styleDescription?: string;
  strength?: number;
  analyzeFirst?: boolean;
  preserveTransparency?: boolean;
  originalWidth?: number;
  originalHeight?: number;
  imageSize?: '1K' | '2K';
  apiProvider?: 'volcengine' | 'gemini' | 'replicate' | 'seedream' | 'nanoBanana'; // 指定使用的 API
}

export interface ConversionResult {
  imageUrl: string;
  cost: number;
  apiUsed: 'volcengine' | 'gemini' | 'replicate' | 'seedream' | 'nanoBanana';
  reason?: string;
}

/**
 * 将预设风格映射到火山引擎的 req_key
 * 根据 stylePresets.ts 中的风格 ID 映射到火山引擎支持的风格
 */
const PRESET_TO_VOLCENGINE_MAP: Record<string, string> = {
  // 艺术风格
  'watercolor': 'watercolor',       // 水彩画
  'ink': 'ink',                     // 水墨画
  'clay': 'clay',                   // 粘土
  'realistic': 'realistic',         // 真实混合
  
  // 动漫风格
  'anime': 'anime',                 // 吉卜力动漫
  'cartoon': 'cartoon',             // 卡通
  'angel': 'angel',                 // 天使
  'princess': 'princess',           // 公主
  
  // 设计风格
  '3d': '3d',                       // 3D 迪士尼

  'fantasy': 'fantasy',             // 幻想
  
  // 特殊效果
  'comic': 'comic',                 // 漫画
};

/**
 * 检查风格是否支持火山引擎 API
 */
function canUseVolcengine(stylePreset?: string): boolean {
  if (!isVolcengineAvailable()) {
    console.log('[ImageConversion] Volcengine API not available: missing credentials');
    return false;
  }
  
  if (!stylePreset) {
    console.log('[ImageConversion] No style preset provided');
    return false;
  }
  
  const volcengineStyle = PRESET_TO_VOLCENGINE_MAP[stylePreset];
  if (!volcengineStyle) {
    console.log(`[ImageConversion] Style "${stylePreset}" not mapped to Volcengine`);
    return false;
  }
  
  if (!VOLCENGINE_STYLE_MAP[volcengineStyle]) {
    console.log(`[ImageConversion] Volcengine style "${volcengineStyle}" not found in VOLCENGINE_STYLE_MAP`);
    return false;
  }
  
  console.log(`[ImageConversion] Style "${stylePreset}" can use Volcengine (mapped to "${volcengineStyle}")`);
  return true;
}

/**
 * 使用火山引擎 API 转换图片
 */
async function convertWithVolcengine(
  imageBase64: string,
  stylePreset: string
): Promise<ConversionResult> {
  const volcengineStyle = PRESET_TO_VOLCENGINE_MAP[stylePreset];
  
  if (!volcengineStyle) {
    throw new Error(`Style ${stylePreset} not mapped to Volcengine`);
  }
  
  const result = await convertImageWithVolcengine({
    imageBase64,
    style: volcengineStyle,
  });
  
  if (!result.success || !result.imageBase64) {
    throw new Error(result.error || 'Volcengine API failed');
  }
  
  // 将 base64 转换为 URL（上传到 S3）
  const buffer = Buffer.from(result.imageBase64, 'base64');
  const { storagePut } = await import('../storage');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const fileKey = `converted/${timestamp}-${randomSuffix}.jpg`;
  const { url } = await storagePut(fileKey, buffer, 'image/jpeg');
  
  return {
    imageUrl: url,
    cost: result.cost,
    apiUsed: 'volcengine',
  };
}

/**
 * 使用 Gemini API 转换图片
 */
async function convertWithGemini(
  imageUrl: string,
  styleDescription: string,
  options: Partial<ConversionOptions>
): Promise<ConversionResult> {
  const result = await convertImageStyle(
    imageUrl,
    styleDescription,
    options.strength,
    options.analyzeFirst,
    options.preserveTransparency,
    options.originalWidth,
    options.originalHeight,
    options.imageSize
  );
  
  // Gemini 成本计算（根据分辨率）
  const cost = options.imageSize === '2K' ? 0.39 : 0.29;
  
  return {
    imageUrl: result.imageUrl,
    cost,
    apiUsed: 'gemini',
  };
}

/**
 * 将图片 URL 转换为 base64
 */
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

/**
 * 生成风格描述（用于 Gemini API）
 */
function generateStyleDescription(stylePreset?: string, customDescription?: string): string {
  if (customDescription) {
    return customDescription;
  }
  
  if (stylePreset) {
    // 根据预设风格生成描述
    const styleDescriptions: Record<string, string> = {
      '3d_render': 'Transform into a 3D rendered style with smooth surfaces and vibrant colors',
      'anime': 'Convert to anime style with bold lines and expressive features',
      'watercolor': 'Apply watercolor painting style with soft colors and flowing textures',
      'cartoon': 'Transform into cartoon style with simplified shapes and bright colors',
      'ink_painting': 'Convert to traditional Chinese ink painting style',
      'clay': 'Transform into cute clay sculpture style',
      'realistic': 'Enhance to photorealistic style with detailed textures',
      'comic': 'Convert to comic book style with bold outlines and dramatic shading',
    };
    
    return styleDescriptions[stylePreset] || `Transform the image to ${stylePreset} style`;
  }
  
  return 'Transform the image while preserving its main content';
}

/**
 * 检查风格是否支持 Replicate API
 * 支持预设风格和自定义描述模式
 */
function canUseReplicate(stylePreset?: string, customDescription?: string): boolean {
  if (!isReplicateAvailable()) {
    return false;
  }
  
  // 支持自定义描述模式
  if (customDescription) {
    return true;
  }
  
  // 支持预设风格模式
  if (stylePreset && REPLICATE_STYLE_PROMPTS[stylePreset]) {
    return true;
  }
  
  return false;
}

/**
 * 使用 Replicate API 转换图片
 */
async function convertWithReplicate(
  imageUrl: string,
  stylePreset: string | undefined,
  options: Partial<ConversionOptions>
): Promise<ConversionResult> {
  const result = await convertImageWithReplicate({
    imageUrl,
    style: stylePreset,
    prompt: options.styleDescription, // 支持自定义 prompt
    strength: options.strength,
  });
  
  if (!result.success || !result.imageUrl) {
    throw new Error(result.error || 'Replicate conversion failed');
  }
  
  return {
    imageUrl: result.imageUrl,
    cost: result.cost,
    apiUsed: 'replicate',
  };
}

/**
 * 统一的图像转换接口
 * 支持三个 API：火山引擎、Gemini、Replicate
 * 如果用户指定了 apiProvider，则强制使用该 API
 * 否则优先使用火山引擎，失败时自动切换到 Gemini
 */
export async function convertImage(options: ConversionOptions): Promise<ConversionResult> {
  const {
    imageUrl,
    imageBase64: providedBase64,
    stylePreset,
    styleDescription: customDescription,
    apiProvider,
  } = options;
  
  // 如果用户指定了 API，则强制使用
  if (apiProvider) {
    console.log(`[ImageConversion] User specified API: ${apiProvider}`);
    
    if (apiProvider === 'volcengine') {
      if (!canUseVolcengine(stylePreset)) {
        throw new Error('Volcengine API is not available or style not supported');
      }
      const imageBase64 = providedBase64 || await imageUrlToBase64(imageUrl);
      return await convertWithVolcengine(imageBase64, stylePreset!);
    }
    
    if (apiProvider === 'replicate') {
      if (!canUseReplicate(stylePreset, customDescription)) {
        throw new Error('Replicate API is not available or style not supported');
      }
      return await convertWithReplicate(imageUrl, stylePreset, options);
    }
    
    if (apiProvider === 'gemini') {
      const styleDescription = generateStyleDescription(stylePreset, customDescription);
      return await convertWithGemini(imageUrl, styleDescription, options);
    }
    
    if (apiProvider === 'seedream') {
      const prompt = customDescription || generateStyleDescription(stylePreset, customDescription);
      // 此推理接入点只支持 4K 分辨率（经测试确认）
      const seedreamSize = '4K';
      console.log(`[ImageConversion] Seedream using size: ${seedreamSize} (original: ${options.imageSize})`);
      const imageUrlResult = await convertWithSeedream({
        imageUrl,
        prompt,
        size: seedreamSize
      });
      return {
        imageUrl: imageUrlResult,
        cost: getSeedreamCost(),
        apiUsed: 'seedream',
      };
    }
    
    if (apiProvider === 'nanoBanana') {
      // Nano Banana 通过 Replicate 平台调用 google/nano-banana 模型
      if (!canUseReplicate(stylePreset, customDescription)) {
        throw new Error('Replicate API is not available');
      }
      const prompt = customDescription || generateStyleDescription(stylePreset, customDescription);
      return await convertWithReplicate(imageUrl, stylePreset, {
        ...options,
        styleDescription: prompt,
      });
    }
  }
  
  // 自动选择：优先火山引擎 > Replicate > Gemini
  
  // 1. 尝试使用火山引擎 API（仅限预设风格）
  if (canUseVolcengine(stylePreset)) {
    try {
      console.log(`[ImageConversion] Attempting Volcengine API for style: ${stylePreset}`);
      const imageBase64 = providedBase64 || await imageUrlToBase64(imageUrl);
      const result = await convertWithVolcengine(imageBase64, stylePreset!);
      console.log(`[ImageConversion] Volcengine API succeeded, cost: ¥${result.cost}`);
      return result;
    } catch (error: any) {
      console.warn(`[ImageConversion] Volcengine API failed: ${error.message}`);
    }
  }
  
  // 2. 尝试使用 Replicate API
  if (canUseReplicate(stylePreset, customDescription)) {
    try {
      console.log(`[ImageConversion] Attempting Replicate API for style: ${stylePreset || 'custom'}`);
      const result = await convertWithReplicate(imageUrl, stylePreset, options);
      console.log(`[ImageConversion] Replicate API succeeded, cost: ¥${result.cost}`);
      return {
        ...result,
        reason: 'Volcengine not available, using Replicate',
      };
    } catch (error: any) {
      console.warn(`[ImageConversion] Replicate API failed: ${error.message}`);
    }
  }
  
  // 3. 使用 Gemini API（最终备用方案）
  console.log(`[ImageConversion] Using Gemini API as final fallback`);
  const styleDescription = generateStyleDescription(stylePreset, customDescription);
  const result = await convertWithGemini(imageUrl, styleDescription, options);
  console.log(`[ImageConversion] Gemini API succeeded, cost: ¥${result.cost}`);
  
  return {
    ...result,
    reason: 'Other APIs not available or failed, using Gemini',
  };
}

/**
 * 获取支持的风格列表
 */
export function getSupportedStyles(): {
  volcengine: string[];
  all: string[];
} {
  return {
    volcengine: Object.keys(PRESET_TO_VOLCENGINE_MAP),
    all: Object.keys(PRESET_TO_VOLCENGINE_MAP), // 所有风格都支持（通过 Gemini 备用）
  };
}
