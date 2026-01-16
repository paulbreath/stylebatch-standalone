import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userQuotas, users } from "../../drizzle/schema";
import { eq, like, or, sql } from "drizzle-orm";

export const adminRouter = router({
  /**
   * 搜索用户
   */
  searchUsers: adminProcedure
    .input(
      z.object({
        query: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // 搜索用户（按邮箱或用户名）
      const results = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          or(
            like(users.email, `%${input.query}%`),
            like(users.name, `%${input.query}%`)
          )
        )
        .limit(20);

      return results;
    }),

  /**
   * 获取用户详细信息（包括额度）
   */
  getUserDetail: adminProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // 获取用户信息
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error("User not found");
      }

      // 获取用户额度信息
      const quota = await db
        .select()
        .from(userQuotas)
        .where(eq(userQuotas.userId, input.userId))
        .limit(1);

      return {
        user: user[0],
        quota: quota[0] || null,
      };
    }),

  /**
   * 设置测试人员额度
   */
  setTesterQuota: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        quota: z.number().min(0).max(10000),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // 检查用户是否存在
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (user.length === 0) {
        throw new Error("User not found");
      }

      // 检查是否已有额度记录
      const existingQuota = await db
        .select()
        .from(userQuotas)
        .where(eq(userQuotas.userId, input.userId))
        .limit(1);

      if (existingQuota.length === 0) {
        // 创建新的额度记录
        await db.insert(userQuotas).values({
          userId: input.userId,
          membershipType: "free",
          totalQuota: 5,
          usedQuota: 0,
          remainingQuota: 5,
          addonQuota: 0,
          lifetimeUsage: 0,
          isTester: 1,
          testerQuota: input.quota,
          testerNote: input.note || null,
        });
      } else {
        // 更新现有记录
        await db
          .update(userQuotas)
          .set({
            isTester: 1,
            testerQuota: input.quota,
            testerNote: input.note || null,
          })
          .where(eq(userQuotas.userId, input.userId));
      }

      return {
        success: true,
        message: `已为用户 ${user[0].name || user[0].email} 设置测试额度 ${input.quota} 张`,
      };
    }),

  /**
   * 移除测试人员身份
   */
  removeTester: adminProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(userQuotas)
        .set({
          isTester: 0,
          testerQuota: 0,
          testerNote: null,
        })
        .where(eq(userQuotas.userId, input.userId));

      return {
        success: true,
        message: "已移除测试人员身份",
      };
    }),

  /**
   * 获取所有测试人员列表
   */
  listTesters: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const testers = await db
      .select({
        userId: userQuotas.userId,
        name: users.name,
        email: users.email,
        testerQuota: userQuotas.testerQuota,
        testerNote: userQuotas.testerNote,
        lifetimeUsage: userQuotas.lifetimeUsage,
        createdAt: userQuotas.createdAt,
      })
      .from(userQuotas)
      .innerJoin(users, eq(userQuotas.userId, users.id))
      .where(eq(userQuotas.isTester, 1));

    return testers;
  }),
});
