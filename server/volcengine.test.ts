/**
 * 火山引擎 API 集成测试
 */

import { describe, it, expect, beforeAll } from "vitest";
import { convertImageStyleWithVolcengine, STYLE_MAPPING } from "./volcengine";

describe("Volcengine API Integration", () => {
  const testImageUrl = "https://picsum.photos/800/600"; // 测试图片 URL

  beforeAll(() => {
    // 检查环境变量
    if (!process.env.VOLCENGINE_ACCESS_KEY || !process.env.VOLCENGINE_SECRET_KEY) {
      console.warn("Volcengine API credentials not configured, tests will be skipped");
    }
  });

  it("should have style mappings for all preset styles", () => {
    const expectedStyles = [
      "watercolor",
      "oil_painting",
      "sketch",
      "ink_wash",
      "ukiyo_e",
      "van_gogh",
      "picasso",
      "black_white",
      "vintage",
      "cinematic",
      "hdr",
      "lomography",
      "flat_design",
      "3d_render",
      "pixel_art",
      "cyberpunk",
      "steampunk",
      "minimalist",
      "anime",
      "comic",
      "neon",
      "glitch",
    ];

    for (const style of expectedStyles) {
      expect(STYLE_MAPPING[style]).toBeDefined();
      expect(STYLE_MAPPING[style]).toMatch(/^img2img/);
    }
  });

  it.skipIf(!process.env.VOLCENGINE_ACCESS_KEY)(
    "should convert image with watercolor style",
    async () => {
      const result = await convertImageStyleWithVolcengine(testImageUrl, "watercolor", 0.75);

      expect(result).toBeDefined();
      expect(result.imageUrl).toBeTruthy();
      expect(result.mimeType).toBe("image/png");
      expect(result.imageUrl).toMatch(/^https?:\/\//);

      console.log("Converted image URL:", result.imageUrl);
    },
    30000 // 30秒超时
  );

  it.skipIf(!process.env.VOLCENGINE_ACCESS_KEY)(
    "should convert image with 3D render style",
    async () => {
      const result = await convertImageStyleWithVolcengine(testImageUrl, "3d_render", 0.75);

      expect(result).toBeDefined();
      expect(result.imageUrl).toBeTruthy();
      expect(result.mimeType).toBe("image/png");

      console.log("Converted image URL:", result.imageUrl);
    },
    30000
  );

  it.skipIf(!process.env.VOLCENGINE_ACCESS_KEY)(
    "should throw error for unsupported style",
    async () => {
      await expect(
        convertImageStyleWithVolcengine(testImageUrl, "invalid_style", 0.75)
      ).rejects.toThrow("Unsupported style");
    }
  );

  it("should throw error when credentials are missing", async () => {
    const originalAccessKey = process.env.VOLCENGINE_ACCESS_KEY;
    const originalSecretKey = process.env.VOLCENGINE_SECRET_KEY;

    // 临时删除环境变量
    delete process.env.VOLCENGINE_ACCESS_KEY;
    delete process.env.VOLCENGINE_SECRET_KEY;

    await expect(
      convertImageStyleWithVolcengine(testImageUrl, "watercolor", 0.75)
    ).rejects.toThrow("Volcengine API credentials not configured");

    // 恢复环境变量
    process.env.VOLCENGINE_ACCESS_KEY = originalAccessKey;
    process.env.VOLCENGINE_SECRET_KEY = originalSecretKey;
  });
});
