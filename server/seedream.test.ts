/**
 * Seedream API 测试
 * 验证 API Key 是否有效
 */

import { describe, it, expect } from "vitest";
import { convertWithSeedream, getSeedreamCost } from "./lib/seedream";

describe("Seedream API", () => {
  it("should return correct cost", () => {
    const cost = getSeedreamCost();
    expect(cost).toBe(0.25);
  });

  it("should convert image with Seedream API", async () => {
    // 使用一个高分辨率的测试图片（Seedream 要求至少 3,686,400 像素）
    const testImageUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4";
    const testPrompt = "转换为水彩画风格";

    const result = await convertWithSeedream({
      imageUrl: testImageUrl,
      prompt: testPrompt,
      size: "4K",
    });

    // 验证返回的是一个有效的 URL
    expect(result).toMatch(/^https?:\/\/.+/);
  }, 30000); // 设置 30 秒超时，因为 API 调用可能需要一些时间
});
