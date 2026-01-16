import { describe, expect, it } from "vitest";
import { testGeminiConnection } from "./gemini";

describe("Gemini API", () => {
  it("should connect successfully with valid API key", async () => {
    const result = await testGeminiConnection();
    expect(result).toBe(true);
  }, 30000); // 30 second timeout for API call
});
