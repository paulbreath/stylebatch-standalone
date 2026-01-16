import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, float, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt 加密后的密码
  name: text("name"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 图片风格转换任务表
 * 存储每次转换的完整信息
 */
export const conversionTasks = mysqlTable("conversion_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 关联用户
  batchTaskId: int("batchTaskId"), // 批量任务 ID（可选）
  
  // 原始图片信息
  originalImageUrl: text("originalImageUrl").notNull(), // S3 URL
  originalImageKey: varchar("originalImageKey", { length: 500 }).notNull(), // S3 Key
  originalFileName: varchar("originalFileName", { length: 255 }).notNull(),
  
  // 风格信息
  styleType: mysqlEnum("styleType", ["preset", "custom", "reference"]).notNull(), // 预设/自定义/参考图
  stylePreset: varchar("stylePreset", { length: 100 }), // 预设风格名称（如果是预设）
  styleDescription: text("styleDescription"), // 风格描述（自定义或预设的完整描述）
  referenceImageUrl: text("referenceImageUrl"), // 参考图 URL
  referenceImageKey: varchar("referenceImageKey", { length: 500 }), // 参考图 S3 Key
  strength: float("strength").default(0.75).notNull(), // 转换强度 0-1
  preserveTransparency: int("preserveTransparency").default(0).notNull(), // 是否保持背景透明 (0=否, 1=是)
  originalWidth: int("originalWidth"), // 原图宽度
  originalHeight: int("originalHeight"), // 原图高度
  
  // 处理状态
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"), // 错误信息
  
  // 结果信息
  resultImageUrl: text("resultImageUrl"), // 转换后的图片 S3 URL
  resultImageKey: varchar("resultImageKey", { length: 500 }), // 转换后的图片 S3 Key
  
  // 分析信息（可选）
  analysisData: text("analysisData"), // JSON 格式的图片分析结果
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ConversionTask = typeof conversionTasks.$inferSelect;
export type InsertConversionTask = typeof conversionTasks.$inferInsert;

/**
 * 批量转换任务表
 * 用于管理批量转换的整体进度
 */
export const batchTasks = mysqlTable("batch_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // 批量任务信息
  name: varchar("name", { length: 255 }).notNull(), // 批量任务名称
  styleType: mysqlEnum("styleType", ["preset", "custom", "reference"]).notNull(),
  stylePreset: varchar("stylePreset", { length: 100 }),
  styleDescription: text("styleDescription"),
  referenceImageUrl: text("referenceImageUrl"), // 参考图 URL
  referenceImageKey: varchar("referenceImageKey", { length: 500 }), // 参考图 S3 Key
  strength: float("strength").default(0.75).notNull(),
  preserveTransparency: int("preserveTransparency").default(0).notNull(), // 是否保持背景透明 (0=否, 1=是)
  analyzeFirst: int("analyzeFirst").default(0).notNull(), // 是否先分析图片 (0=否, 1=是)
  
  // 进度信息
  totalCount: int("totalCount").notNull(), // 总图片数
  completedCount: int("completedCount").default(0).notNull(), // 已完成数
  failedCount: int("failedCount").default(0).notNull(), // 失败数
  
  // 状态
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type BatchTask = typeof batchTasks.$inferSelect;
export type InsertBatchTask = typeof batchTasks.$inferInsert;

/**
 * 用户额度表
 * 记录每个用户的当前额度和使用情况
 */
export const userQuotas = mysqlTable("user_quotas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // 关联用户
  
  // 会员信息
  membershipType: mysqlEnum("membershipType", ["free", "monthly", "quarterly", "yearly", "enterprise"]).default("free").notNull(),
  membershipExpireAt: timestamp("membershipExpireAt"), // 会员到期时间
  
  // 额度信息
  totalQuota: int("totalQuota").default(5).notNull(), // 总额度（免费用户每日5张，VIP根据套餐）
  usedQuota: int("usedQuota").default(0).notNull(), // 已使用额度
  remainingQuota: int("remainingQuota").default(5).notNull(), // 剩余额度
  
  // 额度包（VIP用户可购买）
  addonQuota: int("addonQuota").default(0).notNull(), // 额度包剩余数量
  addonExpireAt: timestamp("addonExpireAt"), // 额度包到期时间
  
  // 统计信息
  lastResetAt: timestamp("lastResetAt").defaultNow().notNull(), // 上次重置时间（免费用户每日重置）
  lifetimeUsage: int("lifetimeUsage").default(0).notNull(), // 累计使用次数
  
  // 测试人员字段
  isTester: tinyint("isTester").default(0).notNull(), // 是否为测试人员 (0=否, 1=是)
  testerQuota: int("testerQuota").default(0).notNull(), // 测试人员专属额度
  testerNote: text("testerNote"), // 测试人员备注
  
  // 时间戳
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserQuota = typeof userQuotas.$inferSelect;
export type InsertUserQuota = typeof userQuotas.$inferInsert;

/**
 * 会员订单表
 * 记录用户的会员购买历史
 */
export const membershipOrders = mysqlTable("membership_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // 订单信息
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(), // 订单号
  membershipType: mysqlEnum("membershipType", ["monthly", "quarterly", "yearly"]).notNull(),
  amount: float("amount").notNull(), // 支付金额
  quota: int("quota").notNull(), // 获得的额度
  
  // 支付信息
  paymentMethod: varchar("paymentMethod", { length: 32 }), // 支付方式（wechat/alipay/stripe）
  paymentId: varchar("paymentId", { length: 255 }), // 第三方支付 ID
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  
  // 时间戳
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MembershipOrder = typeof membershipOrders.$inferSelect;
export type InsertMembershipOrder = typeof membershipOrders.$inferInsert;

/**
 * 额度包订单表
 * 记录用户的额度包购买历史
 */
export const addonOrders = mysqlTable("addon_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  
  // 订单信息
  orderNo: varchar("orderNo", { length: 64 }).notNull().unique(),
  quota: int("quota").notNull(), // 购买的额度数量
  amount: float("amount").notNull(), // 支付金额
  
  // 支付信息
  paymentMethod: varchar("paymentMethod", { length: 32 }),
  paymentId: varchar("paymentId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"]).default("pending").notNull(),
  
  // 时间戳
  paidAt: timestamp("paidAt"),
  expireAt: timestamp("expireAt"), // 额度包到期时间（1年后）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AddonOrder = typeof addonOrders.$inferSelect;
export type InsertAddonOrder = typeof addonOrders.$inferInsert;
