# StyleBatch 项目任务清单

## ✅ 已完成的功能

- [x] 项目初始化（tRPC + Manus Auth + Database）
- [x] 集成 Gemini API 实现图像风格转换
- [x] 实现单张图片转换功能
- [x] 实现批量图片转换功能
- [x] 支持预设风格模式
- [x] 支持参考图模式
- [x] 支持自定义描述模式
- [x] 文件上传到 S3 存储
- [x] 转换历史记录保存到数据库
- [x] 删除 Replicate 测试代码
- [x] 删除 Python 微服务代码
- [x] 从 package.json 移除 replicate 依赖
- [x] 清理环境变量配置
- [x] 浏览器功能测试

## ❌ 已放弃的方案

### 火山引擎 API 集成（已放弃）
- 原因：服务未开通，错误码 50400 Access Denied

### Replicate API 集成（已放弃）
- 原因：账户余额不足，需要充值

### Stable Diffusion 本地部署（已放弃）
- 原因：需要 GPU 硬件（至少 10GB VRAM），沙盒环境不支持

## 🎯 最终方案：Gemini API

**优势**：
- ✅ 已集成且工作正常
- ✅ 功能强大（支持参考图学习）
- ✅ 无需额外配置
- ✅ 稳定可靠

**成本**：
- 约 $0.04/次（¥0.29/次）

## 📝 待完成的任务

- [ ] 编写使用文档
- [ ] 保存项目检查点
- [ ] 备份代码到 GitHub

## 🎨 新功能：图片预览

- [x] 分析现有转换页面代码结构
- [x] 在转换结果区域添加图片预览组件
- [x] 实现原图与转换后图片的对比查看
- [x] 添加下载按钮到预览界面
- [x] 测试预览功能
- [x] 保存检查点

## 💰 用户限额和 VIP 会员系统

- [x] 设计限额和收费方案
- [x] 扩展数据库 schema（用户额度表、会员表、用量记录表）
- [x] 实现后端限额检查逻辑
- [x] 实现用量统计和重置机制
- [x] 实现前端额度显示组件
- [x] 添加企业版无限额度功能
- [x] 设置管理员为企业版用户
- [ ] 添加 VIP 会员入口和套餐展示
- [ ] 集成支付功能（Stripe）
- [ ] 测试限额和会员功能

## 🔧 测试人员权限管理

- [x] 设计测试人员权限方案
- [x] 添加后端管理接口（设置/查询测试额度）
- [x] 创建管理后台页面
- [x] 实现用户搜索功能
- [x] 实现额度设置功能
- [x] 测试管理功能
- [ ] 添加操作日志记录（可选）
- [x] 保存检查点

## 🐛 修复 Imagen API 宽高比错误

- [x] 分析错误原因
- [x] 实现宽高比自动匹配逻辑
- [x] 测试不同尺寸图片
- [x] 保存检查点

## 💰 定价调整（30% 毛利）+ 模型选择

- [x] 重新计算定价方案（确保 30% 毛利）
- [x] 更新 PRICING_PLAN.md
- [x] 集成 Nano Banana Pro API（2K 分辨率）
- [x] 实现后端分辨率选择逻辑
- [x] 实现前端分辨率选择器
- [x] 更新定价显示
- [x] 测试 2K 分辨率
- [x] 保存检查点

## 🔄 火山引擎 API 重新集成（解决 Gemini 配额限制）

- [x] 分析之前火山引擎集成失败的原因
- [x] 检查火山引擎账号开通的服务类型
- [x] 重新配置火山引擎 API 密钥
- [x] 测试火山引擎图像风格转换功能
- [ ] 验证成本计算是否正确
- [x] 保存检查点

**测试结果**：火山引擎 API 签名验证失败（401 SignatureDoesNotMatch），可能原因：
1. API 密钥不正确或已过期
2. 未开通图像风格转换服务（CVProcess API）
3. 签名算法与服务端不匹配

**建议**：联系火山引擎技术支持或使用其他 API 服务

## 🎯 火山引擎 ImageStyleConversion API 集成（正确的 API）

- [x] 更新代码使用 ImageStyleConversion 替代 CVProcess
- [x] 更新 API 版本为 2020-08-26
- [x] 使用官方签名算法
- [x] 测试 jzcartoon（剪纸风）和 watercolor_cartoon（水彩风）
- [ ] 映射所有 22 种风格到火山引擎的 type 参数
- [ ] 集成到项目的风格转换流程
- [x] 保存检查点

**测试结果**：
- ✅ 签名算法正确（使用官方 Node.js 签名示例）
- ❌ API 持续返回 **500 Internal Server Error**（服务端内部错误）
- ⚠️ **严重限制**：
  1. 仅支持 **2 种风格**：jzcartoon（剪纸风）、watercolor_cartoon（水彩风）
  2. 仅支持 **人像照片**，不支持风景、动物等其他类型
  3. 项目需要 **22 种风格** + 支持 **任意图片类型**

**结论**：火山引擎 ImageStyleConversion API **功能过于受限，不适合作为 Gemini 的替代方案**

## 🎯 火山引擎 CVProcess API 集成（AIGC 图像风格化）

- [x] 找到正确的 API：CVProcess (2022-08-31)
- [x] 创建新的 API 密钥
- [x] 使用官方签名算法
- [x] 测试多种风格（5/5 成功）
- [x] 查看定价信息（¥0.06/次）
- [x] 创建 volcengine_official.ts SDK
- [x] 添加环境变量到 env.ts
- [ ] 集成到项目的风格转换流程
- [ ] 实现双 API 切换逻辑（Gemini + 火山引擎）
- [x] 保存检查点

**测试结果**：
- ✅ API 调用成功！
- ✅ 支持 25 种风格（已测试 6 种）
- ✅ 支持任意图片类型（风景、人像等）
- ✅ 处理速度：3-7 秒/张
- ✅ 成本：¥0.06/次（比 Gemini 便宜 79%）

**定价对比**：
| API | 单价 | 配额限制 | 参考图学习 |
|-----|------|---------|-------------|
| 火山引擎 | ¥0.06/次 | 200次免费，付费无限制 | ❌ 不支持 |
| Gemini | ¥0.29/次 | 70次/天（Tier 1） | ✅ 支持 |

## 🔄 双 API 策略（火山引擎 + Gemini）

- [x] 设计 API 切换逻辑（优先火山引擎，失败时切换 Gemini）
- [x] 创建统一的图像转换接口（imageConversionService.ts）
- [x] 实现火山引擎风格映射（15种风格 → req_key）
- [x] 实现 Gemini 风格映射（保持现有逻辑）
- [x] 添加 API 状态监控和错误处理
- [x] 更新成本计算逻辑（根据使用的 API）
- [x] 更新单张转换路由
- [x] 更新批量转换路由
- [x] 测试自动切换功能
- [x] 创建说明文档（DUAL_API_STRATEGY.md）
- [x] 保存检查点

**实现细节**：
- ✅ 创建了 `imageConversionService.ts` 统一服务
- ✅ 支持 15 种预设风格映射到火山引擎
- ✅ 自动检测火山引擎是否可用
- ✅ 失败时自动切换到 Gemini
- ✅ 记录使用的 API 和成本
- ✅ 支持自动图片 URL 转 base64

## 🎯 添加三个 AI 模型选项（火山引擎、Gemini、Nano Banana）

- [x] 集成 Replicate API（Nano Banana）
- [x] 创建 replicate.ts SDK
- [x] 修改前端转换页面，添加三个模型选项
- [x] 更新后端 API，支持 `apiProvider` 参数
- [x] 修改 imageConversionService，支持三个 API
- [x] 更新定价显示（火山引擎 ¥0.06/张，Gemini ¥0.29/张，Replicate ¥0.09/张）
- [x] 测试三个模型
- [x] 保存检查点

## 🐛 修复火山引擎 API 转换失败

- [x] 诊断错误原因："Volcengine API is not available or style not supported"
- [x] 检查 isVolcengineAvailable() 函数
- [x] 检查风格映射是否正确
- [x] 更新 PRESET_TO_VOLCENGINE_MAP 映射表
- [x] 添加详细的日志输出
- [x] 测试修复后的功能
- [x] 保存检查点

**问题原因**：前端发送的风格 ID（如 `watercolor`、`3d_render`）与后端的火山引擎风格映射不匹配。

**修复方案**：
1. 更新 `PRESET_TO_VOLCENGINE_MAP`，确保所有支持的风格都正确映射
2. 添加详细的日志输出，方便调试
3. 不支持的风格会自动切换到 Gemini API

## 🐛 修复 Replicate API 模型路径错误

- [x] 查找正确的 FLUX img2img 模型路径
- [x] 更新 replicate.ts 中的模型路径
- [x] 更新输入参数以匹配 FLUX 2 Dev API
- [x] 测试 Replicate API 转换功能
- [x] 保存检查点

**错误原因**：`bxclib2/flux_img2img` 模型不存在（404 Not Found）

**修复方案**：
1. 更改为 `black-forest-labs/flux-2-dev`
2. 更新输入参数：
   - `prompt`：文本描述
   - `input_images`：输入图片列表
   - `go_fast`：true（快速模式）
   - `aspect_ratio`：match_input_image（保持原图比例）

## 🐛 修复 Replicate API 输出格式错误

- [x] 诊断 FLUX 2 Dev 模型的实际输出格式
- [x] 添加详细日志输出查看 API 返回数据
- [x] 修复输出解析逻辑（支持字符串、数组、对象格式）
- [x] 添加详细日志输出查看 API 返回数据
- [x] 支持多种输出格式（字符串、数组、对象）
- [ ] 修复 FileOutput 对象处理（使用 .url() 方法）
- [ ] 测试修复后的功能
- [x] 保存检查点

**错误信息**："Invalid output from Replicate API: {}"

**修复方案**：
1. 添加详细日志输出查看 API 返回的原始数据
2. 支持多种输出格式：
   - 字符串：直接使用
   - 数组：取第一个元素
   - 对象：尝试从 `url`、`image`、`output` 字段提取

## 🐛 修复 Replicate API 自定义提示词失败

- [x] 修复 FileOutput 对象处理（使用 .url().toString()）
- [x] 测试预设风格（成功 ✅）
- [x] 修复自定义提示词失败问题
- [x] 测试自定义提示词功能
- [x] 保存检查点

## 🔄 替换为真正的 Nano Banana (Gemini 2.5 Flash Image)

- [x] 更新 replicate.ts 模型路径为 google/nano-banana
- [x] 更新输入参数（image_input 替代 input_images）
- [x] 更新成本计算（$0.039/张 ≈ ¥0.28/张）
- [x] 测试预设风格
- [x] 测试自定义提示词
- [x] 保存检查点

## 🔧 隐藏 Gemini Imagen 4.0 选项

- [x] 在前端隐藏 Gemini 选项（注释代码，保留后端逻辑）
- [x] 更新默认 API 选择为火山引擎
- [x] 测试 Nano Banana 模型功能
- [x] 保存检查点

## 💰 更新用户显示价格

- [x] 火山引擎：¥0.06/张（成本）→ ¥0.1/张（用户价格）
- [x] Nano Banana：¥0.28/张（成本）→ ¥0.5/张（用户价格）
- [x] 保存检查点

## 🔄 自定义描述模式自动切换到 Nano Banana

- [x] 在前端添加 useEffect 监听 styleType 变化
- [x] 当 styleType === 'custom' 时，自动设置 apiProvider = 'replicate'
- [x] 添加提示信息告知用户已切换模型
- [x] 测试自动切换功能
- [x] 保存检查点

## 💡 添加自定义描述提示文字

- [x] 在自定义描述输入框下方添加提示：“火山引擎仅支持预设风格，请选择 Nano Banana 使用自定义描述”
- [x] 保存检查点

## 🎨 更新预设风格列表

- [x] 只保留火山引擎支持的 12 种风格
- [x] 隐藏其他不支持的风格
- [x] 保存检查点

## 🐛 修复火山引擎风格 ID 映射问题

- [x] 检查 volcengine_official.ts 中的 VOLCENGINE_STYLE_MAP
- [x] 更新 PRESET_TO_VOLCENGINE_MAP，添加所有 12 种风格的映射
- [x] 确保新的风格 ID 能正确映射到 req_key
- [ ] 测试所有 12 种风格
- [x] 保存检查点

## 🗑️ 移除不支持的 3D 游戏风格

- [x] 从 stylePresets.ts 中移除 3d_game
- [x] 从 PRESET_TO_VOLCENGINE_MAP 中移除 3d_game
- [x] 从 VOLCENGINE_STYLE_MAP 中移除 3d_game
- [x] 保存检查点

## 🔍 调研豆包图像生成 API

- [ ] 搜索豆包 API 文档
- [ ] 查看是否支持图生图（image-to-image）
- [ ] 查看是否支持自定义描述
- [ ] 评估定价和性能
- [ ] 评估集成可行性
- [ ] 向用户报告调研结果

## 🚀 集成火山引擎 Seedream 4.5 API

- [x] 创建 seedream.ts 封装文件
- [x] 实现图生图功能（image-to-image）
- [x] 实现自定义描述功能
- [x] 更新 imageConversionService.ts 添加 Seedream 选项
- [x] 更新前端添加 Seedream 模型选项
- [x] 测试 Seedream API 功能
- [x] 保存检查点

**定价**：
- 成本：¥0.25/张
- 用户价格：¥0.35/张（毛利率 29%）

## 🔧 修复 Seedream API 鉴权方式

- [x] 将鉴权方式从 AK/SK 签名改为 API Key
- [x] 需要在火山引擎控制台获取 API Key
- [x] 更新 seedream.ts 使用 API Key 鉴权
- [x] 修复模型 ID（使用推理接入点 ID：ep-20260116122351-2tlgl）
- [x] 修复参数名称（image_input → image）
- [x] 修复尺寸参数（使用 2K 而不是 1024x1024）
- [x] 测试 Seedream API 功能（成功 ✅）
- [x] 保存检查点

**测试结果**：
- ✅ API Key 鉴权成功
- ✅ 图生图转换成功（21.6 秒）
- ✅ 支持自定义描述
- ✅ 成本：¥0.25/张
- ✅ 用户价格：¥0.35/张

## 🐛 修复 Seedream API 尺寸参数错误

- [x] 诊断错误原因："the specified size is not supported for model doubao-seedream-4-5"
- [x] 检查前端发送的 imageSize 参数
- [x] 检查后端 seedream.ts 的 size 参数处理
- [x] 查看 Seedream API 文档确认支持的尺寸格式
- [x] 修复尺寸参数传递逻辑
- [x] 测试修复后的功能
- [x] 保存检查点

**问题原因**：推理接入点 `ep-20260116122351-2tlgl` **只支持 4K 分辨率**，不支持 1K 和 2K。

**修复方案**：
1. 强制 Seedream 使用 `'4K'` 分辨率
2. 更新 imageConversionService.ts 中的逻辑
3. 更新 seedream.ts 默认尺寸为 4K
4. 更新测试代码使用 4K

**测试结果**：
- ✅ curl 测试成功（4K 分辨率）
- ✅ 生成图片尺寸：4992x3328
- ✅ 耗时：约 60 秒

## 🚀 开放批量转换功能入口

- [x] 查看批量转换页面代码（Batch.tsx）
- [x] 移除“功能开发中”占位符
- [x] 实现批量图片上传功能（已存在）
- [x] 实现批量转换任务提交（已存在）
- [x] 实现批量转换进度显示（已存在）
- [x] 实现批量结果下载（已存在）
- [x] 测试批量转换功能
- [x] 保存检查点

**实现细节**：
- ✅ 批量转换功能已在 Batch.tsx 中完整实现
- ✅ Convert.tsx 中的批量转换标签页已更新为入口页
- ✅ 支持多图上传、实时进度、ZIP 打包下载

## 🔧 限制批量转换支持的模型

- [x] 移除批量转换页面的“预设风格”标签页
- [x] 添加模型选择器（Seedream 4.5 / Nano Banana）
- [x] 更新后端批量转换逻辑，只支持自定义描述和参考图模式
- [x] 更新 UI 说明文本
- [x] 测试批量转换功能
- [x] 保存检查点

**原因**：
- 火山引擎只支持 11 种预设风格，不适合批量转换的灵活性需求
- Seedream 4.5 和 Nano Banana 支持自定义描述和参考图，更适合批量转换场景

**实现细节**：
- ✅ 前端：移除预设风格标签页，保留自定义和参考图
- ✅ 前端：添加 AI 模型选择器（Seedream 4.5 / Nano Banana）
- ✅ 后端：添加 apiProvider 参数到 batch router
- ✅ 后端：更新 imageConversionService 支持 nanoBanana
- ✅ 后端：传递 apiProvider 到 convertImage 函数

## 🐛 修复 Nano Banana 模型调用错误

- [x] 将 nanoBanana 从 convertWithGemini 改为 convertWithReplicate
- [x] 更新 imageConversionService.ts 中的调用逻辑
- [x] 测试 Nano Banana 模型（通过 Replicate）
- [x] 验证不受 Google Gemini 配额限制
- [x] 保存检查点

**问题原因**：
- ❌ 当前实现错误地调用 Google Gemini API（配额已耗尽）
- ✅ 应该调用 Replicate 的 `google/nano-banana` 模型

**修复方案**：
- 修改 `apiProvider === 'nanoBanana'` 分支，调用 `convertWithReplicate`
- 确保使用 Replicate API Token 而不是 Google API Key

**测试结果**：
- ✅ 成功调用 `google/nano-banana` 模型
- ✅ 转换时间：9.5 秒（比预期快！）
- ✅ 成本：¥0.28/张
- ✅ 不受 Google Gemini 配额限制
- ✅ 返回有效的图片 URL

## 🔙 添加全屏预览模态框

- [x] 查找预览图界面代码（Convert.tsx）
- [x] 创建全屏预览模态框组件
- [x] 添加返回/关闭按钮
- [x] 支持 ESC 键关闭
- [x] 添加下载按钮
- [x] 测试预览功能
- [x] 保存检查点

**实现方案**：
- 创建全屏模态框显示转换结果
- 左上角添加关闭按钮（X 图标）
- 右上角添加下载按钮
- 支持点击背景关闭
- 支持 ESC 键快捷关闭

## 📝 历史记录保存用户提示词

- [x] 查看数据库表结构（tasks 表）
- [x] 添加字段保存自定义风格描述和参考图提示词（已存在）
- [x] 修改后端保存逻辑，记录提示词（已实现）
- [x] 修改前端历史记录页面，显示提示词
- [x] 添加“复用提示词”按钮
- [x] 测试提示词保存和复用功能
- [x] 保存检查点

**实现细节**：
- ✅ 数据库已有 `styleDescription` 字段
- ✅ 后端已正确保存提示词
- ✅ 前端历史记录显示风格描述（最多2行）
- ✅ 添加“复用提示词”按钮，点击复制到剪贴板
- ✅ 显示风格类型标签（预设/自定义/参考图）
- ✅ Toast 提示复制成功

## 🐛 修复下载文件名问题

- [x] 检查历史记录页面的下载按钮实现
- [x] 检查转换结果页面的下载按钮实现
- [x] 修复下载文件名逻辑，保留原始文件名
- [x] 测试下载功能
- [x] 保存检查点

**问题原因**：
- 下载按钮使用 `<a href={url} download>` 没有指定文件名
- 浏览器默认使用 URL 中的文件名（S3 随机生成的）

**修复方案**：
- ✅ History.tsx：使用 `download={task.originalFileName}`
- ✅ Convert.tsx：使用 `download={selectedFile?.name.replace(/\.[^/.]+$/, "-converted.png")}`
- ✅ 下载文件名格式：`原始文件名-converted.png`

## 🖼️ 历史记录添加全屏预览功能

- [x] 为历史记录页面集成 ImagePreviewModal 组件
- [x] 添加点击缩略图打开预览的交互
- [x] 测试全屏预览功能
- [x] 保存检查点

**实现细节**：
- ✅ 集成 ImagePreviewModal 组件
- ✅ 缩略图添加 cursor-pointer 和 hover 效果
- ✅ 点击缩略图打开全屏预览
- ✅ 预览模态框包含关闭和下载按钮
- ✅ 支持 ESC 键和点击背景关闭

## 📚 编写腾讯云部署文档

- [x] 编写服务器购买和配置步骤
- [x] 编写数据库创建和配置步骤
- [x] 编写 COS 对象存储配置步骤
- [x] 编写代码部署步骤
- [x] 编写环境变量配置说明
- [x] 编写域名绑定和 SSL 证书配置
- [x] 编写自动化部署脚本
- [x] 编写监控和日志配置
- [x] 准备部署脚本文件
- [x] 交付部署文档给用户

**已完成文档**：
- ✅ `docs/腾讯云部署指南.md`：完整的部署步骤文档
- ✅ `deploy.sh`：自动化部署脚本
- ✅ `docs/nginx.conf.example`：Nginx 配置模板

**方案**：腾讯云方案B（稳定可靠版）
- 轻量应用服务器：2核4GB，80GB SSD
- 云数据库 MySQL：1核1GB，20GB存储
- 对象存储 COS：按需使用
- 总成本：约 ¥670/月

## 🌏 独立版本开发（支持香港用户）

### 阶段 1：保存当前版本并创建新项目
- [ ] 保存当前版本 checkpoint
- [ ] 创建新的 GitHub 仓库（stylebatch-standalone）
- [ ] 复制项目代码到新目录

### 阶段 2：移除 Manus OAuth 并实现独立用户系统
- [ ] 移除 Manus OAuth 相关代码
- [ ] 实现邮箱+密码注册/登录系统
- [ ] 实现 JWT token 认证
- [ ] 更新前端登录/注册页面
- [ ] 更新用户数据库表结构

### 阶段 3：集成 Cloudflare R2 存储
- [ ] 移除 Manus S3 存储代码
- [ ] 集成 Cloudflare R2 SDK
- [ ] 更新文件上传逻辑
- [ ] 更新文件访问 URL 生成逻辑
- [ ] 测试图片上传和访问

### 阶段 4：更新数据库配置
- [ ] 移除 Manus 数据库依赖
- [ ] 配置 Zeabur MySQL 连接
- [ ] 运行数据库迁移
- [ ] 测试数据库连接

### 阶段 5：测试和部署
- [ ] 本地测试所有功能
- [ ] 推送代码到新仓库
- [ ] 在 Zeabur 创建新项目
- [ ] 配置环境变量
- [ ] 部署并测试

### 阶段 6：交付
- [ ] 编写独立版本部署文档
- [ ] 创建 checkpoint
- [ ] 向用户交付新仓库链接和文档
