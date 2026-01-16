/**
 * 预设风格模板
 * 12 种火山引擎支持的艺术风格
 */

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  example?: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  // 艺术风格
  {
    id: "watercolor",
    name: "水彩画",
    description: "柔和的水彩画风格，具有流畅的笔触、透明的色彩层次和纸张质感。色彩自然晕染，边缘柔和模糊。",
    category: "艺术风格",
  },
  {
    id: "ink",
    name: "水墨画",
    description: "中国传统水墨画风格，使用墨色的浓淡干湿变化，讲究留白和意境，笔法洒脱写意。",
    category: "艺术风格",
  },
  {
    id: "clay",
    name: "粘土",
    description: "粘土手工风格，柔软的质感、圆润的造型和手工制作的温馨感。",
    category: "艺术风格",
  },
  {
    id: "realistic",
    name: "真实混合",
    description: "真实照片与艺术风格的混合，保留真实感的同时增加艺术效果。",
    category: "艺术风格",
  },

  // 动漫风格
  {
    id: "anime",
    name: "吉卜力动漫",
    description: "吉卜力工作室动漫风格，温暖的色调、细腻的画面和梦幻的氛围。",
    category: "动漫风格",
  },
  {
    id: "cartoon",
    name: "卡通",
    description: "卡通风格，简化的形状、鲜艳的色彩和可爱的造型。",
    category: "动漫风格",
  },
  {
    id: "angel",
    name: "天使",
    description: "天使主题风格，柔和的光晕、圣洁的氛围和梦幻的色彩。",
    category: "动漫风格",
  },
  {
    id: "princess",
    name: "公主",
    description: "公主主题风格，华丽的装饰、梦幻的色彩和童话般的氛围。",
    category: "动漫风格",
  },

  // 设计风格
  {
    id: "3d",
    name: "3D 迪士尼",
    description: "迪士尼 3D 动画风格，光滑的表面、鲜艳的色彩和可爱的造型。",
    category: "设计风格",
  },

  {
    id: "fantasy",
    name: "幻想",
    description: "奇幻风格，魔法般的光效、梦幻的色彩和超现实的氛围。",
    category: "设计风格",
  },

  // 特殊效果
  {
    id: "comic",
    name: "漫画",
    description: "美式漫画风格，粗黑的轮廓线、网点阴影、鲜明的色块和戏剧性表现。",
    category: "特殊效果",
  },
];

/**
 * 按类别分组的预设风格
 */
export function getStylePresetsByCategory(): Record<string, StylePreset[]> {
  const grouped: Record<string, StylePreset[]> = {};
  
  for (const preset of STYLE_PRESETS) {
    if (!grouped[preset.category]) {
      grouped[preset.category] = [];
    }
    grouped[preset.category].push(preset);
  }
  
  return grouped;
}

/**
 * 根据 ID 获取预设风格
 */
export function getStylePresetById(id: string): StylePreset | undefined {
  return STYLE_PRESETS.find((preset) => preset.id === id);
}

/**
 * 获取所有类别
 */
export function getStyleCategories(): string[] {
  return Array.from(new Set(STYLE_PRESETS.map((preset) => preset.category)));
}
