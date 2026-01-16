import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, conversionTasks, InsertConversionTask, ConversionTask, batchTasks, InsertBatchTask, BatchTask, userQuotas, UserQuota, InsertUserQuota } from "../drizzle/schema";
import { ENV } from './_core/env';

// Initialize database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

export const db = drizzle(process.env.DATABASE_URL);

let _db: ReturnType<typeof drizzle> | null = db;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== 转换任务相关 ====================

/**
 * 创建转换任务
 */
export async function createConversionTask(task: InsertConversionTask): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(conversionTasks).values(task);
  return Number(result[0].insertId);
}

/**
 * 更新转换任务
 */
export async function updateConversionTask(
  taskId: number,
  updates: Partial<ConversionTask>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(conversionTasks).set(updates).where(eq(conversionTasks.id, taskId));
}

/**
 * 获取转换任务
 */
export async function getConversionTask(taskId: number): Promise<ConversionTask | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(conversionTasks).where(eq(conversionTasks.id, taskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 获取用户的转换历史
 */
export async function getUserConversionHistory(
  userId: number,
  limit: number = 50
): Promise<ConversionTask[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(conversionTasks)
    .where(eq(conversionTasks.userId, userId))
    .orderBy(desc(conversionTasks.createdAt))
    .limit(limit);
}

// ==================== 批量任务相关 ====================

/**
 * 创建批量任务
 */
export async function createBatchTask(task: InsertBatchTask): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(batchTasks).values(task);
  return Number(result[0].insertId);
}

/**
 * 更新批量任务
 */
export async function updateBatchTask(
  batchId: number,
  updates: Partial<BatchTask>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(batchTasks).set(updates).where(eq(batchTasks.id, batchId));
}

/**
 * 获取批量任务
 */
export async function getBatchTask(batchId: number): Promise<BatchTask | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(batchTasks).where(eq(batchTasks.id, batchId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * 获取用户的批量任务列表
 */
export async function getUserBatchTasks(userId: number, limit: number = 20): Promise<BatchTask[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(batchTasks)
    .where(eq(batchTasks.userId, userId))
    .orderBy(desc(batchTasks.createdAt))
    .limit(limit);
}

/**
 * 获取批量任务的所有转换任务
 */
export async function getBatchConversionTasks(batchId: number): Promise<ConversionTask[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db
    .select()
    .from(conversionTasks)
    .where(eq(conversionTasks.batchTaskId, batchId))
    .orderBy(desc(conversionTasks.createdAt));
}

/**
 * 获取批量任务的统计信息
 */
export async function getBatchTaskStats(batchId: number): Promise<{
  total: number;
  completed: number;
  failed: number;
  processing: number;
}> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tasks = await db
    .select()
    .from(conversionTasks)
    .where(eq(conversionTasks.batchTaskId, batchId));

  return {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    failed: tasks.filter(t => t.status === "failed").length,
    processing: tasks.filter(t => t.status === "processing" || t.status === "pending").length,
  };
}

// ==================== 用户额度管理 ====================

/**
 * 获取或创建用户额度记录
 */
export async function getUserQuota(userId: number): Promise<UserQuota> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 查找现有额度记录
  const result = await db.select().from(userQuotas).where(eq(userQuotas.userId, userId)).limit(1);
  
  if (result.length > 0) {
    return result[0];
  }

  // 创建新的额度记录（免费用户，每日 5 张）
  const newQuota: InsertUserQuota = {
    userId,
    membershipType: "free",
    totalQuota: 5,
    usedQuota: 0,
    remainingQuota: 5,
    addonQuota: 0,
    lifetimeUsage: 0,
  };

  await db.insert(userQuotas).values(newQuota);
  
  // 返回新创建的记录
  const created = await db.select().from(userQuotas).where(eq(userQuotas.userId, userId)).limit(1);
  return created[0];
}

/**
 * 检查用户是否有足够的额度
 */
export async function checkUserQuota(userId: number, required: number = 1): Promise<{ hasQuota: boolean; remaining: number; message?: string }> {
  const quota = await getUserQuota(userId);
  
  // 企业版用户无限额度
  if (quota.membershipType === "enterprise") {
    return { hasQuota: true, remaining: 999999 };
  }
  
  // 测试人员使用专属额度
  if (quota.isTester) {
    if (quota.testerQuota >= required) {
      return { hasQuota: true, remaining: quota.testerQuota };
    } else {
      return {
        hasQuota: false,
        remaining: quota.testerQuota,
        message: `测试额度不足，剩余 ${quota.testerQuota} 张。请联系管理员增加额度。`
      };
    }
  }
  
  // 检查是否需要重置（免费用户每日重置）
  if (quota.membershipType === "free") {
    const now = new Date();
    const lastReset = new Date(quota.lastResetAt);
    
    // 如果是不同的天，重置额度
    if (now.getDate() !== lastReset.getDate() || 
        now.getMonth() !== lastReset.getMonth() || 
        now.getFullYear() !== lastReset.getFullYear()) {
      await resetDailyQuota(userId);
      return { hasQuota: required <= 5, remaining: 5 };
    }
  }
  
  // 计算总剩余额度（会员额度 + 额度包）
  const totalRemaining = quota.remainingQuota + quota.addonQuota;
  
  if (totalRemaining >= required) {
    return { hasQuota: true, remaining: totalRemaining };
  }
  
  // 额度不足
  if (quota.membershipType === "free") {
    return {
      hasQuota: false,
      remaining: totalRemaining,
      message: `免费用户每日限额 5 张，今日剩余 ${totalRemaining} 张。升级 VIP 获取更多额度！`
    };
  } else {
    return {
      hasQuota: false,
      remaining: totalRemaining,
      message: `额度不足，剩余 ${totalRemaining} 张。请购买额度包或等待下个周期重置。`
    };
  }
}

/**
 * 消耗用户额度
 */
export async function consumeUserQuota(userId: number, amount: number = 1): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const quota = await getUserQuota(userId);
  
  // 企业版用户不消耗额度，但记录使用次数
  if (quota.membershipType === "enterprise") {
    await db
      .update(userQuotas)
      .set({
        lifetimeUsage: quota.lifetimeUsage + amount,
      })
      .where(eq(userQuotas.userId, userId));
    return;
  }
  
  // 测试人员消耗测试额度
  if (quota.isTester) {
    await db
      .update(userQuotas)
      .set({
        testerQuota: quota.testerQuota - amount,
        lifetimeUsage: quota.lifetimeUsage + amount,
      })
      .where(eq(userQuotas.userId, userId));
    return;
  }
  
  // 优先消耗会员额度，再消耗额度包
  let remainingToConsume = amount;
  let newRemainingQuota = quota.remainingQuota;
  let newAddonQuota = quota.addonQuota;
  
  if (newRemainingQuota >= remainingToConsume) {
    // 会员额度足够
    newRemainingQuota -= remainingToConsume;
  } else {
    // 会员额度不够，消耗额度包
    remainingToConsume -= newRemainingQuota;
    newRemainingQuota = 0;
    newAddonQuota -= remainingToConsume;
  }
  
  // 更新数据库
  await db
    .update(userQuotas)
    .set({
      usedQuota: quota.usedQuota + amount,
      remainingQuota: newRemainingQuota,
      addonQuota: newAddonQuota,
      lifetimeUsage: quota.lifetimeUsage + amount,
    })
    .where(eq(userQuotas.userId, userId));
}

/**
 * 重置免费用户的每日额度
 */
export async function resetDailyQuota(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(userQuotas)
    .set({
      usedQuota: 0,
      remainingQuota: 5,
      lastResetAt: new Date(),
    })
    .where(eq(userQuotas.userId, userId));
}

/**
 * 升级用户会员
 */
export async function upgradeMembership(
  userId: number,
  membershipType: "monthly" | "quarterly" | "yearly",
  quota: number,
  expireAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db
    .update(userQuotas)
    .set({
      membershipType,
      membershipExpireAt: expireAt,
      totalQuota: quota,
      remainingQuota: quota,
      usedQuota: 0,
      lastResetAt: new Date(),
    })
    .where(eq(userQuotas.userId, userId));
}

/**
 * 添加额度包
 */
export async function addAddonQuota(
  userId: number,
  quota: number,
  expireAt: Date
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const currentQuota = await getUserQuota(userId);
  
  await db
    .update(userQuotas)
    .set({
      addonQuota: currentQuota.addonQuota + quota,
      addonExpireAt: expireAt,
    })
    .where(eq(userQuotas.userId, userId));
}
