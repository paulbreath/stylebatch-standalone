/**
 * 图片风格转换相关的 tRPC 路由
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createConversionTask,
  updateConversionTask,
  getConversionTask,
  getUserConversionHistory,
  checkUserQuota,
  consumeUserQuota,
} from "../db";
import { analyzeImage, analyzeReferenceStyle } from "../gemini";
import { storagePut } from "../storage";
import { getStylePresetById } from "../stylePresets";
import { convertImage } from "../lib/imageConversionService";

export const conversionRouter = router({
  /**
   * 单张图片转换
   */
  convertSingle: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string().url(),
        imageKey: z.string(),
        fileName: z.string(),
        styleType: z.enum(["preset", "custom", "reference"]),
        stylePreset: z.string().optional(),
        styleDescription: z.string().optional(),
        referenceImageUrl: z.string().url().optional(), // 参考图 URL
        referenceImageKey: z.string().optional(), // 参考图 Key
        referencePrompt: z.string().optional(), // 参考图额外提示词
        strength: z.number().min(0).max(1).default(0.75),
        analyzeFirst: z.boolean().default(false),
        preserveTransparency: z.boolean().default(false), // 是否保持背景透明
        originalWidth: z.number().optional(), // 原图宽度
        originalHeight: z.number().optional(), // 原图高度
        imageSize: z.enum(['1K', '2K']).default('1K'), // 图片分辨率
        apiProvider: z.enum(['volcengine', 'gemini', 'replicate', 'seedream']).optional(), // AI 模型选择
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // 检查用户额度
      const quotaCheck = await checkUserQuota(userId, 1);
      if (!quotaCheck.hasQuota) {
        throw new Error(quotaCheck.message || "额度不足");
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
          console.error("[Conversion] Failed to analyze reference style:", error);
          throw new Error("Failed to analyze reference image style");
        }
      }

      // 创建任务记录
      const taskId = await createConversionTask({
        userId,
        originalImageUrl: input.imageUrl,
        originalImageKey: input.imageKey,
        originalFileName: input.fileName,
        styleType: input.styleType,
        stylePreset: input.stylePreset || null,
        styleDescription: finalStyleDescription,
        referenceImageUrl: input.referenceImageUrl || null,
        referenceImageKey: input.referenceImageKey || null,
        strength: input.strength,
        preserveTransparency: input.preserveTransparency ? 1 : 0,
        originalWidth: input.originalWidth || null,
        originalHeight: input.originalHeight || null,
        status: "processing",
      });

      // 异步处理转换
      processConversion(
        taskId,
        input.imageUrl,
        input.fileName,
        finalStyleDescription,
        input.strength,
        input.analyzeFirst,
        input.preserveTransparency,
        input.originalWidth,
        input.originalHeight,
        input.imageSize,
        input.stylePreset,
        input.apiProvider
      ).catch(
        (error) => {
          console.error(`[Conversion] Task ${taskId} failed:`, error);
          updateConversionTask(taskId, {
            status: "failed",
            errorMessage: error.message,
          });
        }
      );

      // 消耗额度
      await consumeUserQuota(userId, 1);

      return { taskId };
    }),

  /**
   * 查询转换任务状态
   */
  getTaskStatus: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const task = await getConversionTask(input.taskId);
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      // 确保只能查询自己的任务
      if (task.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return task;
    }),

  /**
   * 获取转换历史
   */
  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional().default(50) }))
    .query(async ({ ctx, input }) => {
      return await getUserConversionHistory(ctx.user.id, input.limit);
    }),
});

/**
 * 处理图片转换的异步函数
 */
async function processConversion(
  taskId: number,
  imageUrl: string,
  originalFileName: string,
  styleDescription: string,
  strength: number,
  analyzeFirst: boolean,
  preserveTransparency: boolean = false,
  originalWidth?: number,
  originalHeight?: number,
  imageSize: '1K' | '2K' = '1K',
  stylePreset?: string,
  apiProvider?: 'volcengine' | 'gemini' | 'replicate' | 'seedream'
) {
  try {
    // 分析图片（可选）
    let analysis = undefined;
    if (analyzeFirst) {
      analysis = await analyzeImage(imageUrl);
      await updateConversionTask(taskId, {
        analysisData: JSON.stringify(analysis),
      });
    }

    // 转换风格（使用统一的图像转换服务）
    const result = await convertImage({
      imageUrl,
      stylePreset,
      styleDescription,
      strength,
      analyzeFirst,
      preserveTransparency,
      originalWidth,
      originalHeight,
      imageSize,
      apiProvider,
    });
    
    // 记录使用的 API
    console.log(`[Conversion] Used ${result.apiUsed} API, cost: ¥${result.cost}`);
    if (result.reason) {
      console.log(`[Conversion] Reason: ${result.reason}`);
    }

    // result.imageUrl 已经是 S3 URL，使用原始文件名生成新的 key
    const fileExt = originalFileName.split(".").pop() || "png";
    const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
    const newFileName = `${fileNameWithoutExt}_converted.${fileExt}`;
    
    await updateConversionTask(taskId, {
      status: "completed",
      resultImageUrl: result.imageUrl,
      resultImageKey: newFileName,
      completedAt: new Date(),
    });
  } catch (error: any) {
    await updateConversionTask(taskId, {
      status: "failed",
      errorMessage: error.message || "Unknown error",
    });
    throw error;
  }
}
