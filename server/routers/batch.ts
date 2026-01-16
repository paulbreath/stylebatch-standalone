/**
 * 批量图片转换相关的 tRPC 路由
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createBatchTask,
  updateBatchTask,
  getBatchTask,
  getUserBatchTasks,
  createConversionTask,
  updateConversionTask,
  getConversionTask,
  getBatchConversionTasks,
  getBatchTaskStats,
  checkUserQuota,
  consumeUserQuota,
} from "../db";
import { analyzeImage, analyzeReferenceStyle } from "../gemini";
import { getStylePresetById } from "../stylePresets";
import { convertImage } from "../lib/imageConversionService";

export const batchRouter = router({
  /**
   * 创建批量转换任务
   */
  createBatch: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        images: z.array(
          z.object({
            url: z.string().url(),
            key: z.string(),
            fileName: z.string(),
          })
        ),
        styleType: z.enum(["preset", "custom", "reference"]),
        apiProvider: z.enum(["seedream", "nanoBanana"]).default("seedream"),
        stylePreset: z.string().optional(),
        styleDescription: z.string().optional(),
        referenceImageUrl: z.string().url().optional(),
        referenceImageKey: z.string().optional(),
        referencePrompt: z.string().optional(),
        strength: z.number().min(0).max(1).default(0.75),
        analyzeFirst: z.boolean().default(false),
        preserveTransparency: z.boolean().default(false), // 是否保持背景透明
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // 检查用户额度（批量转换需要检查总数量）
      const totalImages = input.images.length;
      const quotaCheck = await checkUserQuota(userId, totalImages);
      if (!quotaCheck.hasQuota) {
        throw new Error(quotaCheck.message || `额度不足，需要 ${totalImages} 张，剩余 ${quotaCheck.remaining} 张`);
      }

      // 获取风格描述
      let finalStyleDescription = input.styleDescription || "";
      if (input.styleType === "preset" && input.stylePreset) {
        const preset = getStylePresetById(input.stylePreset);
        if (preset) {
          finalStyleDescription = preset.description;
        }
      } else if (input.styleType === "reference" && input.referenceImageUrl) {
        // 如果是参考图模式，分析参考图风格
        try {
          finalStyleDescription = await analyzeReferenceStyle(
            input.referenceImageUrl,
            input.referencePrompt
          );
        } catch (error) {
          console.error("[Batch] Failed to analyze reference style:", error);
          throw new Error("Failed to analyze reference image style");
        }
      }

      // 创建批量任务
      const batchName = input.name || `批量转换 ${new Date().toLocaleString("zh-CN")}`;
      const batchId = await createBatchTask({
        userId,
        name: batchName,
        styleType: input.styleType,
        stylePreset: input.stylePreset || null,
        styleDescription: finalStyleDescription,
        referenceImageUrl: input.referenceImageUrl || null,
        referenceImageKey: input.referenceImageKey || null,
        strength: input.strength,
        preserveTransparency: input.preserveTransparency ? 1 : 0,
        analyzeFirst: input.analyzeFirst ? 1 : 0,
        totalCount: input.images.length,
        completedCount: 0,
        failedCount: 0,
        status: "processing",
      });

      // 为每张图片创建转换任务
      const taskIds: number[] = [];
      for (const image of input.images) {
        const taskId = await createConversionTask({
          userId,
          batchTaskId: batchId,
          originalImageUrl: image.url,
          originalImageKey: image.key,
          originalFileName: image.fileName,
          styleType: input.styleType,
          stylePreset: input.stylePreset || null,
          styleDescription: finalStyleDescription,
          referenceImageUrl: input.referenceImageUrl || null,
          referenceImageKey: input.referenceImageKey || null,
          strength: input.strength,
          preserveTransparency: input.preserveTransparency ? 1 : 0,
          originalWidth: null, // 将在转换时获取
          originalHeight: null, // 将在转换时获取
          status: "processing",
        });
        taskIds.push(taskId);
      }

      // 消耗额度
      await consumeUserQuota(userId, totalImages);

      // 异步处理批量转换
      processBatchConversion(
        batchId,
        taskIds,
        finalStyleDescription,
        input.strength,
        input.analyzeFirst,
        input.styleType,
        input.apiProvider,
        input.stylePreset
      ).catch((error) => {
        console.error(`[Batch] Batch ${batchId} failed:`, error);
        updateBatchTask(batchId, {
          status: "failed",
        });
      });

      return { batchId, taskIds };
    }),

  /**
   * 获取批量任务状态
   */
  getBatchStatus: protectedProcedure
    .input(z.object({ batchId: z.number() }))
    .query(async ({ ctx, input }) => {
      const batch = await getBatchTask(input.batchId);

      if (!batch) {
        throw new Error("Batch task not found");
      }

      // 确保只能查询自己的任务
      if (batch.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // 获取所有子任务
      const tasks = await getBatchConversionTasks(input.batchId);

      // 获取统计信息
      const stats = await getBatchTaskStats(input.batchId);

      return {
        batch,
        tasks,
        stats,
      };
    }),

  /**
   * 获取批量任务列表
   */
  getBatchList: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ ctx, input }) => {
      return await getUserBatchTasks(ctx.user.id, input.limit);
    }),
});

/**
 * 处理批量转换的异步函数
 */
async function processBatchConversion(
  batchId: number,
  taskIds: number[],
  styleDescription: string,
  strength: number,
  analyzeFirst: boolean,
  styleType: "preset" | "custom" | "reference",
  apiProvider: "seedream" | "nanoBanana",
  stylePreset?: string
) {
  let completedCount = 0;
  let failedCount = 0;

  for (const taskId of taskIds) {
    try {
      const task = await getConversionTask(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // 分析图片（可选）
      if (analyzeFirst) {
        const analysis = await analyzeImage(task.originalImageUrl);
        await updateConversionTask(taskId, {
          analysisData: JSON.stringify(analysis),
        });
      }

      // 转换风格（使用统一的图像转换服务）
      const result = await convertImage({
        imageUrl: task.originalImageUrl,
        apiProvider,
        stylePreset,
        styleDescription,
        strength,
        analyzeFirst,
      });
      
      // 记录使用的 API
      console.log(`[Batch] Task ${taskId} used ${result.apiUsed} API, cost: ¥${result.cost}`);
      if (result.reason) {
        console.log(`[Batch] Task ${taskId} reason: ${result.reason}`);
      }

      // 更新任务状态
      await updateConversionTask(taskId, {
        status: "completed",
        resultImageUrl: result.imageUrl,
        resultImageKey: result.imageUrl.split("/").pop() || "",
        completedAt: new Date(),
      });

      completedCount++;
    } catch (error: any) {
      console.error(`[Batch] Task ${taskId} failed:`, error);
      await updateConversionTask(taskId, {
        status: "failed",
        errorMessage: error.message || "Unknown error",
      });
      failedCount++;
    }

    // 更新批量任务进度
    await updateBatchTask(batchId, {
      completedCount,
      failedCount,
    });
  }

  // 更新批量任务状态
  const finalStatus = failedCount === taskIds.length ? "failed" : "completed";
  await updateBatchTask(batchId, {
    status: finalStatus,
    completedAt: new Date(),
  });
}
