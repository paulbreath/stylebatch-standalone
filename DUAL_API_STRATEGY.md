# 双 API 策略说明

## 概述

StyleBatch 实现了智能双 API 策略，优先使用火山引擎 API（成本更低），失败时自动切换到 Gemini API（功能更强大）。

---

## API 对比

| 特性 | 火山引擎 CVProcess | Gemini Imagen |
|------|-------------------|---------------|
| **单价** | ¥0.06/次 | ¥0.29/次（1K）/ ¥0.39/次（2K） |
| **成本优势** | 比 Gemini 便宜 79% | - |
| **配额** | 200次免费，付费无限制 | 70次/天（Tier 1） |
| **风格数** | 25种预设风格 | 无限制（通过 prompt） |
| **参考图学习** | ❌ 不支持 | ✅ 支持 |
| **处理速度** | 3-7秒/张 | 5-10秒/张 |
| **图片类型** | 任意类型 ✅ | 任意类型 ✅ |
| **QPS限制** | 1-2 QPS | 无明确限制 |

---

## 切换逻辑

### 1. 火山引擎优先

当满足以下条件时，优先使用火山引擎 API：

- ✅ 火山引擎 API 密钥已配置
- ✅ 使用预设风格（非自定义描述）
- ✅ 风格在支持列表中

### 2. 自动切换到 Gemini

以下情况会使用 Gemini API：

- ❌ 火山引擎 API 密钥未配置
- ❌ 使用自定义风格描述
- ❌ 使用参考图模式
- ❌ 风格不在火山引擎支持列表中
- ❌ 火山引擎 API 调用失败

---

## 支持的风格映射

### 火山引擎支持的风格（15种）

| 预设风格 | 火山引擎 req_key | 说明 |
|---------|-----------------|------|
| `3d_render` | `3d` | 3D 渲染风格 |
| `disney_3d` | `3d` | 迪士尼 3D 风格 |
| `pixar_3d` | `3d` | 皮克斯 3D 风格 |
| `anime` | `anime` | 动漫风格 |
| `ghibli` | `anime` | 吉卜力风格 |
| `makoto_shinkai` | `anime` | 新海诚风格 |
| `cartoon` | `cartoon` | 卡通风格 |
| `comic` | `comic` | 漫画风格 |
| `watercolor` | `watercolor` | 水彩风格 |
| `ink_painting` | `ink` | 水墨画风格 |
| `chinese_ink` | `ink` | 中国水墨风格 |
| `clay` | `clay` | 粘土风格 |
| `pixel_art` | `clay` | 像素风格（映射到粘土） |
| `realistic` | `realistic` | 写实风格 |
| `photorealistic` | `realistic` | 照片级写实 |

### 所有风格都支持（通过 Gemini 备用）

即使风格不在火山引擎支持列表中，系统也会自动切换到 Gemini API，确保所有风格都能正常工作。

---

## 实现细节

### 核心文件

1. **`server/lib/volcengine_official.ts`**
   - 火山引擎官方 SDK 实现
   - 使用官方签名算法
   - 支持 25 种风格

2. **`server/lib/imageConversionService.ts`**
   - 统一的图像转换服务
   - 实现双 API 切换逻辑
   - 自动检测 API 可用性
   - 记录 API 使用和成本

3. **`server/routers/conversion.ts`**
   - 单张图片转换路由
   - 使用统一服务

4. **`server/routers/batch.ts`**
   - 批量图片转换路由
   - 使用统一服务

### 日志示例

```
[ImageConversion] Attempting Volcengine API for style: 3d_render
[ImageConversion] Volcengine API succeeded, cost: ¥0.06
```

或

```
[ImageConversion] Volcengine not available or style not supported, using Gemini
[ImageConversion] Gemini API succeeded, cost: ¥0.29
```

或

```
[ImageConversion] Attempting Volcengine API for style: watercolor
[ImageConversion] Volcengine API failed: ..., falling back to Gemini
[ImageConversion] Gemini API succeeded, cost: ¥0.29
Reason: Volcengine failed, fallback to Gemini
```

---

## 成本优化

### 预计成本节省

假设每天处理 1000 张图片，其中 70% 使用预设风格：

**使用单一 Gemini API**：
- 成本：1000 × ¥0.29 = ¥290/天
- 月成本：¥8,700

**使用双 API 策略**：
- 火山引擎：700 × ¥0.06 = ¥42
- Gemini：300 × ¥0.29 = ¥87
- 总成本：¥129/天
- 月成本：¥3,870

**节省**：¥4,830/月（55.6%）

---

## 配置要求

### 环境变量

```bash
# 火山引擎 API（可选，未配置时自动使用 Gemini）
VOLCENGINE_ACCESS_KEY=your_access_key
VOLCENGINE_SECRET_KEY=your_secret_key

# Gemini API（必需）
GEMINI_API_KEY=your_gemini_api_key
```

### 火山引擎账户设置

1. 注册火山引擎账号
2. 开通"AIGC 图像风格化"服务
3. 创建 API 密钥
4. 配置环境变量

---

## 测试

### 手动测试

1. 上传图片
2. 选择预设风格（如"3D 渲染"）
3. 开始转换
4. 查看服务器日志，确认使用的 API

### 预期结果

- 预设风格 → 使用火山引擎 API
- 自定义描述 → 使用 Gemini API
- 参考图模式 → 使用 Gemini API
- 火山引擎失败 → 自动切换到 Gemini API

---

## 未来优化

1. **添加 API 选择器** - 让用户手动选择使用哪个 API
2. **成本统计** - 在数据库中记录每次转换的实际成本
3. **智能调度** - 根据 API 配额和成本动态选择
4. **缓存机制** - 相同图片+风格的结果缓存复用
5. **批量优化** - 批量任务时智能分配到不同 API

---

## 常见问题

### Q: 为什么有时候用 Gemini 而不是火山引擎？

A: 可能的原因：
1. 使用了自定义风格描述
2. 使用了参考图模式
3. 风格不在火山引擎支持列表中
4. 火山引擎 API 密钥未配置或失效

### Q: 如何强制使用 Gemini API？

A: 使用"自定义描述"模式而不是"预设风格"模式。

### Q: 火山引擎失败后会重试吗？

A: 不会。失败后会立即切换到 Gemini API，确保用户体验流畅。

### Q: 成本如何计算？

A: 系统会记录每次转换使用的 API 和成本：
- 火山引擎：¥0.06/次
- Gemini 1K：¥0.29/次
- Gemini 2K：¥0.39/次

---

## 总结

双 API 策略实现了：
- ✅ **成本优化** - 降低 79% 的 API 成本
- ✅ **高可用性** - 自动故障切换
- ✅ **无缝体验** - 用户无感知切换
- ✅ **灵活扩展** - 易于添加更多 API 提供商
