import { COOKIE_NAME } from "./_core/constants";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { conversionRouter } from "./routers/conversion";
import { stylesRouter } from "./routers/styles";
import { uploadRouter } from "./routers/upload";
import { batchRouter } from "./routers/batch";
import { quotaRouter } from "./routers/quota";
import { adminRouter } from "./routers/admin";
import { register, login } from "./auth";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    // 用户注册
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await register(input.email, input.password, input.name);
        
        // 设置 cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, result.token, cookieOptions);
        
        return result;
      }),
    
    // 用户登录
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await login(input.email, input.password);
        
        // 设置 cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, result.token, cookieOptions);
        
        return result;
      }),
    
    // 用户登出
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 图片转换功能
  conversion: conversionRouter,
  
  // 批量转换
  batch: batchRouter,
  
  // 风格预设
  styles: stylesRouter,
  
  // 文件上传
  upload: uploadRouter,
  
  // 用户额度
  quota: quotaRouter,
  
  // 管理后台
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
