/**
 * 用户额度相关的 tRPC 路由
 */

import { protectedProcedure, router } from "../_core/trpc";
import { getUserQuota } from "../db";

export const quotaRouter = router({
  /**
   * 获取当前用户的额度信息
   */
  getMyQuota: protectedProcedure.query(async ({ ctx }) => {
    const quota = await getUserQuota(ctx.user.id);
    
    // 计算总剩余额度
    const totalRemaining = quota.remainingQuota + quota.addonQuota;
    
    return {
      ...quota,
      totalRemaining,
      isFree: quota.membershipType === "free",
      isVip: quota.membershipType !== "free",
    };
  }),
});
