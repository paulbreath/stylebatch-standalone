import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { db } from './db';
import { users, userQuotas } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'user' | 'admin';
}

/**
 * 生成 JWT token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // 7天过期
    .sign(secret);
  
  return token;
}

/**
 * 验证 JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * 用户注册
 */
export async function register(email: string, password: string, name?: string) {
  // 检查邮箱是否已存在
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new Error('Email already exists');
  }

  // 密码加密
  const hashedPassword = await bcrypt.hash(password, 10);

  // 创建用户
  const [user] = await db.insert(users).values({
    email,
    password: hashedPassword,
    name: name || email.split('@')[0], // 默认用邮箱前缀作为用户名
    role: 'user',
  });

  // 创建用户额度记录
  await db.insert(userQuotas).values({
    userId: user.insertId,
    membershipType: 'free',
    totalQuota: 5,
    usedQuota: 0,
    remainingQuota: 5,
  });

  // 生成 token
  const token = await generateToken({
    userId: user.insertId,
    email,
    role: 'user',
  });

  return {
    user: {
      id: user.insertId,
      email,
      name: name || email.split('@')[0],
      role: 'user' as const,
    },
    token,
  };
}

/**
 * 用户登录
 */
export async function login(email: string, password: string) {
  // 查找用户
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  // 更新最后登录时间
  await db.update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, user.id));

  // 生成 token
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token,
  };
}

/**
 * 从 token 获取用户信息
 */
export async function getUserFromToken(token: string) {
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
