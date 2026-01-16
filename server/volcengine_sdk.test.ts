import { describe, it, expect } from "vitest";
import { convertImageStyleWithVolcengineSDK, SDK_STYLE_MAPPING } from "./volcengine_sdk";

describe("Volcengine SDK Integration", () => {
  const testImageUrl =
    "https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/logo-icon.png";

  it("should convert image with watercolor style", async () => {
    const result = await convertImageStyleWithVolcengineSDK(testImageUrl, "watercolor", 0.5);

    expect(result).toHaveProperty("imageUrl");
    expect(result).toHaveProperty("originalImageUrl");
    expect(result.imageUrl).toMatch(/^https:\/\//);
    expect(result.originalImageUrl).toBe(testImageUrl);
  }, 30000);

  it("should convert image with anime style", async () => {
    const result = await convertImageStyleWithVolcengineSDK(testImageUrl, "anime", 0.5);

    expect(result).toHaveProperty("imageUrl");
    expect(result).toHaveProperty("originalImageUrl");
    expect(result.imageUrl).toMatch(/^https:\/\//);
    expect(result.originalImageUrl).toBe(testImageUrl);
  }, 30000);

  it("should throw error for unsupported style", async () => {
    await expect(
      convertImageStyleWithVolcengineSDK(testImageUrl, "unsupported_style", 0.5)
    ).rejects.toThrow("Unsupported style");
  });

  it("should have correct SDK style mapping", () => {
    expect(SDK_STYLE_MAPPING).toHaveProperty("watercolor");
    expect(SDK_STYLE_MAPPING).toHaveProperty("anime");
    expect(SDK_STYLE_MAPPING).toHaveProperty("pixel_art");
    expect(SDK_STYLE_MAPPING.watercolor).toBe("img2img_water_paint_style_usage");
    expect(SDK_STYLE_MAPPING.anime).toBe("img2img_ghibli_style_usage");
  });
});
