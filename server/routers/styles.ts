/**
 * 风格预设相关的 tRPC 路由
 */

import { publicProcedure, router } from "../_core/trpc";
import { STYLE_PRESETS, getStylePresetsByCategory, getStyleCategories } from "../stylePresets";

export const stylesRouter = router({
  /**
   * 获取所有预设风格
   */
  getAll: publicProcedure.query(() => {
    return STYLE_PRESETS;
  }),

  /**
   * 按类别获取预设风格
   */
  getByCategory: publicProcedure.query(() => {
    return getStylePresetsByCategory();
  }),

  /**
   * 获取所有类别
   */
  getCategories: publicProcedure.query(() => {
    return getStyleCategories();
  }),
});
