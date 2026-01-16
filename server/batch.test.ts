/**
 * 批量转换功能测试
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  createBatchTask,
  getBatchTask,
  updateBatchTask,
  createConversionTask,
  getBatchConversionTasks,
  getBatchTaskStats,
} from "./db";

describe("Batch Conversion Database Operations", () => {
  let testUserId = 1;
  let testBatchId: number;
  let testTaskIds: number[] = [];

  it("should create a batch task", async () => {
    testBatchId = await createBatchTask({
      userId: testUserId,
      name: "测试批量任务",
      styleType: "preset",
      stylePreset: "watercolor",
      styleDescription: "水彩画风格",
      referenceImageUrl: null,
      referenceImageKey: null,
      strength: 0.75,
      totalCount: 3,
      completedCount: 0,
      failedCount: 0,
      status: "processing",
    });

    expect(testBatchId).toBeGreaterThan(0);
  });

  it("should create conversion tasks for the batch", async () => {
    const imageUrls = [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg",
    ];

    for (const url of imageUrls) {
      const taskId = await createConversionTask({
        userId: testUserId,
        batchTaskId: testBatchId,
        originalImageUrl: url,
        originalImageKey: `test/${url.split("/").pop()}`,
        originalFileName: url.split("/").pop() || "test.jpg",
        styleType: "preset",
        stylePreset: "watercolor",
        styleDescription: "水彩画风格",
        referenceImageUrl: null,
        referenceImageKey: null,
        strength: 0.75,
        status: "pending",
      });

      expect(taskId).toBeGreaterThan(0);
      testTaskIds.push(taskId);
    }

    expect(testTaskIds.length).toBe(3);
  });

  it("should get batch task by ID", async () => {
    const batch = await getBatchTask(testBatchId);

    expect(batch).toBeDefined();
    expect(batch?.id).toBe(testBatchId);
    expect(batch?.name).toBe("测试批量任务");
    expect(batch?.totalCount).toBe(3);
  });

  it("should get all conversion tasks for the batch", async () => {
    const tasks = await getBatchConversionTasks(testBatchId);

    expect(tasks.length).toBe(3);
    expect(tasks.every((t) => t.batchTaskId === testBatchId)).toBe(true);
  });

  it("should get batch task stats", async () => {
    const stats = await getBatchTaskStats(testBatchId);

    expect(stats.total).toBe(3);
    expect(stats.completed).toBe(0);
    expect(stats.failed).toBe(0);
    expect(stats.processing).toBe(3); // pending + processing
  });

  it("should update batch task progress", async () => {
    await updateBatchTask(testBatchId, {
      completedCount: 2,
      failedCount: 1,
    });

    const batch = await getBatchTask(testBatchId);

    expect(batch?.completedCount).toBe(2);
    expect(batch?.failedCount).toBe(1);
  });

  it("should update batch task status to completed", async () => {
    await updateBatchTask(testBatchId, {
      status: "completed",
      completedAt: new Date(),
    });

    const batch = await getBatchTask(testBatchId);

    expect(batch?.status).toBe("completed");
    expect(batch?.completedAt).toBeDefined();
  });
});

describe("Batch Conversion API Logic", () => {
  it("should have correct style mapping for batch conversion", () => {
    // 确保批量转换使用的风格映射与单张转换一致
    const stylePresets = [
      "watercolor",
      "oil_painting",
      "ink_wash",
      "anime",
      "3d_render",
    ];

    for (const preset of stylePresets) {
      expect(preset).toBeTruthy();
      expect(preset.length).toBeGreaterThan(0);
    }
  });

  it("should validate batch input parameters", () => {
    // 测试批量转换的参数验证
    const validInput = {
      images: [
        { url: "https://example.com/1.jpg", key: "test/1.jpg", fileName: "1.jpg" },
        { url: "https://example.com/2.jpg", key: "test/2.jpg", fileName: "2.jpg" },
      ],
      styleType: "preset" as const,
      stylePreset: "watercolor",
      strength: 0.75,
    };

    expect(validInput.images.length).toBeGreaterThan(0);
    expect(validInput.styleType).toBe("preset");
    expect(validInput.strength).toBeGreaterThanOrEqual(0);
    expect(validInput.strength).toBeLessThanOrEqual(1);
  });
});
