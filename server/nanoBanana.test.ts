/**
 * Nano Banana (Replicate) API 测试
 * 验证通过 Replicate 平台调用 google/nano-banana 模型
 */

import { describe, it, expect } from 'vitest';
import { convertImageWithReplicate } from './lib/replicate';

describe('Nano Banana API', () => {
  it('should convert image using Replicate Nano Banana model', async () => {
    // 使用高分辨率测试图片
    const testImageUrl = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048&h=2048';
    
    const result = await convertImageWithReplicate({
      imageUrl: testImageUrl,
      prompt: 'Transform this landscape into a vibrant watercolor painting style with soft colors and artistic brush strokes',
    });
    
    console.log('[Nano Banana Test] Result:', result);
    
    // 验证结果
    expect(result.success).toBe(true);
    expect(result.imageUrl).toBeDefined();
    expect(result.imageUrl).toMatch(/^https?:\/\//);
    expect(result.cost).toBeGreaterThan(0);
    
    console.log('[Nano Banana Test] ✅ Image URL:', result.imageUrl);
    console.log('[Nano Banana Test] ✅ Cost: ¥', result.cost);
  }, 60000); // 60秒超时
});
