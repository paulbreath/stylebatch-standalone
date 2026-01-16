import { describe, it, expect } from "vitest";
import { convertImageStyleWithVolcengineLegacy, LEGACY_STYLE_MAPPING } from "./volcengine_legacy";

describe("Volcengine Legacy API Integration", () => {
  const testImageUrl =
    "https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/logo-icon.png";

  it("should convert image with watercolor style", async () => {
    const result = await convertImageStyleWithVolcengineLegacy(testImageUrl, "watercolor");

    expect(result).toHaveProperty("imageUrl");
    expect(result).toHaveProperty("originalImageUrl");
    expect(result.imageUrl).toMatch(/^https:\/\//);
    expect(result.originalImageUrl).toBe(testImageUrl);
  }, 30000);

  it("should convert image with papercut style", async () => {
    const result = await convertImageStyleWithVolcengineLegacy(testImageUrl, "papercut");

    expect(result).toHaveProperty("imageUrl");
    expect(result).toHaveProperty("originalImageUrl");
    expect(result.imageUrl).toMatch(/^https:\/\//);
    expect(result.originalImageUrl).toBe(testImageUrl);
  }, 30000);

  it("should throw error for unsupported style", async () => {
    await expect(
      convertImageStyleWithVolcengineLegacy(testImageUrl, "unsupported_style")
    ).rejects.toThrow("Unsupported style for legacy API");
  });

  it("should have correct legacy style mapping", () => {
    expect(LEGACY_STYLE_MAPPING).toHaveProperty("watercolor");
    expect(LEGACY_STYLE_MAPPING).toHaveProperty("papercut");
    expect(LEGACY_STYLE_MAPPING.watercolor).toBe("watercolor_cartoon");
    expect(LEGACY_STYLE_MAPPING.papercut).toBe("jzcartoon");
  });
});
