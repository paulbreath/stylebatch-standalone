/**
 * 文件上传相关的 tRPC 路由
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const uploadRouter = router({
  /**
   * 上传图片（接收 base64）
   */
  uploadImage: protectedProcedure
    .input(
      z.object({
        base64Data: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      
      // 解码 base64
      const base64 = input.base64Data.split(",")[1] || input.base64Data;
      const buffer = Buffer.from(base64, "base64");
      
      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(7);
      const ext = input.fileName.split(".").pop() || "jpg";
      const fileKey = `uploads/${userId}/${timestamp}-${randomSuffix}.${ext}`;
      
      // 上传到 S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      
      return {
        url,
        key: fileKey,
      };
    }),
});
