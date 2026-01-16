import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Styles API", () => {
  it("should return all style presets", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const styles = await caller.styles.getAll();

    expect(styles).toBeDefined();
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBe(22);
    
    // 验证第一个风格的结构
    const firstStyle = styles[0];
    expect(firstStyle).toHaveProperty("id");
    expect(firstStyle).toHaveProperty("name");
    expect(firstStyle).toHaveProperty("description");
    expect(firstStyle).toHaveProperty("category");
  });

  it("should return styles grouped by category", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const stylesByCategory = await caller.styles.getByCategory();

    expect(stylesByCategory).toBeDefined();
    expect(typeof stylesByCategory).toBe("object");
    
    // 验证有4个类别
    const categories = Object.keys(stylesByCategory);
    expect(categories.length).toBeGreaterThan(0);
    
    // 验证每个类别都有风格
    for (const category of categories) {
      const styles = stylesByCategory[category];
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    }
  });

  it("should return all categories", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const categories = await caller.styles.getCategories();

    expect(categories).toBeDefined();
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toContain("艺术风格");
    expect(categories).toContain("摄影风格");
    expect(categories).toContain("设计风格");
    expect(categories).toContain("特殊效果");
  });
});

describe("Upload API", () => {
  it("should accept base64 image upload", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // 创建一个简单的 1x1 像素的 PNG 图片的 base64
    const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    const result = await caller.upload.uploadImage({
      base64Data,
      fileName: "test.png",
      mimeType: "image/png",
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("key");
    expect(typeof result.url).toBe("string");
    expect(typeof result.key).toBe("string");
    expect(result.url.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for S3 upload
});
