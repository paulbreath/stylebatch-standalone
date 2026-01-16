# Zeabur 部署指南 - StyleBatch

本指南将帮助您在 **5 分钟内** 将 StyleBatch 部署到 Zeabur 平台，无需任何服务器配置经验。

---

## 📋 前置准备

1. **GitHub 账号**（已完成 ✅）
   - 您的仓库：https://github.com/paulbreath/stylebatch

2. **Zeabur 账号**（需要注册）
   - 访问：https://zeabur.com
   - 使用 GitHub 账号一键登录

3. **API 密钥**（需要准备）
   - 火山引擎 API Key
   - Seedream API Key（Gemini API Key）
   - Replicate API Token

---

## 🚀 部署步骤

### 第 1 步：注册 Zeabur 账号

1. 访问 https://zeabur.com
2. 点击右上角 **"Sign In"**
3. 选择 **"Continue with GitHub"**
4. 授权 Zeabur 访问您的 GitHub 账号
5. 完成注册！

### 第 2 步：创建项目

1. 登录后，点击 **"Create Project"**（创建项目）
2. 选择 **"Deploy from GitHub"**（从 GitHub 部署）
3. 在仓库列表中找到 **`paulbreath/stylebatch`**
4. 点击 **"Deploy"**（部署）

### 第 3 步：添加数据库

1. 在项目页面，点击 **"Add Service"**（添加服务）
2. 选择 **"MySQL"**
3. Zeabur 会自动创建一个 MySQL 数据库
4. 等待数据库启动（约 30 秒）

### 第 4 步：配置环境变量

1. 点击您的应用服务（stylebatch）
2. 进入 **"Variables"**（环境变量）标签
3. 点击 **"Add Variable"**（添加变量）
4. 逐个添加以下环境变量：

#### 必需的环境变量

```bash
# 数据库连接（自动生成，无需手动添加）
DATABASE_URL=（Zeabur 自动注入）

# 火山引擎配置
VOLCENGINE_ARK_API_KEY=你的火山引擎ARK_API_KEY
VOLCENGINE_ACCESS_KEY=你的火山引擎ACCESS_KEY
VOLCENGINE_SECRET_KEY=你的火山引擎SECRET_KEY

# Seedream 配置（使用 Gemini API Key）
GEMINI_API_KEY=你的Gemini_API_KEY

# Replicate 配置（用于 Nano Banana）
REPLICATE_API_TOKEN=你的Replicate_API_Token

# JWT 密钥（随机生成一个复杂字符串）
JWT_SECRET=你的随机JWT密钥（至少32位）

# OAuth 配置（如果不需要用户登录，可以暂时跳过）
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=你的APP_ID
OWNER_OPEN_ID=你的OPEN_ID
OWNER_NAME=你的名字

# 前端配置
VITE_APP_TITLE=StyleBatch
VITE_APP_LOGO=/logo.png

# Manus 内置 API（如果不使用 Manus 平台，可以跳过）
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=你的FORGE_API_KEY
VITE_FRONTEND_FORGE_API_KEY=你的前端FORGE_API_KEY
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

#### 如何获取 API 密钥

**火山引擎 API Key：**
1. 访问：https://console.volcengine.com/ark
2. 创建推理接入点，获取 API Key
3. 在"访问密钥管理"中获取 ACCESS_KEY 和 SECRET_KEY

**Gemini API Key：**
1. 访问：https://aistudio.google.com/apikey
2. 创建 API Key

**Replicate API Token：**
1. 访问：https://replicate.com/account/api-tokens
2. 创建 API Token

**JWT_SECRET：**
- 生成一个随机字符串（至少 32 位）
- 可以使用在线工具：https://www.random.org/strings/

### 第 5 步：绑定域名（可选）

1. 在应用页面，进入 **"Domains"**（域名）标签
2. Zeabur 会自动分配一个免费域名（如 `xxx.zeabur.app`）
3. 如果您有自己的域名，可以点击 **"Add Domain"** 绑定

### 第 6 步：等待部署完成

1. 部署过程约 **3-5 分钟**
2. 在 **"Logs"**（日志）标签中可以查看部署进度
3. 看到 `Server running on http://localhost:3000/` 表示部署成功
4. 点击域名访问您的应用！

---

## 📊 成本预估

### Zeabur 开发者计划

| 项目 | 价格 | 说明 |
|------|------|------|
| 基础设施 | **¥5/月** | 包含 CPU、内存、带宽 |
| MySQL 数据库 | **免费 1GB** | 足够个人使用 |
| 对象存储 | **免费 5GB** | 存储转换后的图片 |
| **总计** | **¥5/月** | 不含 AI 调用成本 |

### AI 调用成本（按使用付费）

假设每天转换 **100 张图片**，每月 **3000 张**：

| 模型 | 单价 | 月成本 |
|------|------|--------|
| 火山引擎 | ¥0.1/张 | ¥300/月 |
| Seedream 4.5 | ¥0.35/张 | ¥1050/月 |
| Nano Banana | ¥0.4/张 | ¥1200/月 |

**推荐配置：** 主要使用火山引擎（¥0.1/张），高质量需求使用 Seedream（¥0.35/张）

**总成本：** 约 **¥305-605/月**（基础设施 ¥5 + AI 调用 ¥300-600）

---

## 🔧 常见问题

### 1. 部署失败怎么办？

**检查日志：**
- 在 Zeabur 项目页面，点击应用服务
- 进入 **"Logs"** 标签，查看错误信息

**常见错误：**
- `DATABASE_URL not found`：数据库未正确连接，检查 MySQL 服务是否启动
- `API Key invalid`：API 密钥错误，检查环境变量配置
- `Port already in use`：端口冲突，Zeabur 会自动处理，无需担心

### 2. 数据库连接失败？

**解决方案：**
1. 确保 MySQL 服务已启动（绿色状态）
2. Zeabur 会自动注入 `DATABASE_URL`，无需手动配置
3. 如果仍然失败，尝试重启应用服务

### 3. 如何查看应用日志？

1. 在 Zeabur 项目页面，点击应用服务
2. 进入 **"Logs"** 标签
3. 可以实时查看应用运行日志

### 4. 如何更新代码？

**方法 1：自动部署（推荐）**
1. 在 GitHub 仓库中更新代码
2. 推送到 `main` 分支
3. Zeabur 会自动检测并重新部署

**方法 2：手动部署**
1. 在 Zeabur 项目页面，点击应用服务
2. 点击右上角 **"Redeploy"**（重新部署）

### 5. 如何扩容？

1. 在 Zeabur 项目页面，点击应用服务
2. 进入 **"Settings"** → **"Resources"**
3. 调整 CPU 和内存配置
4. 保存并重启

### 6. 如何备份数据？

**数据库备份：**
1. 在 Zeabur 项目页面，点击 MySQL 服务
2. 进入 **"Backups"** 标签
3. 点击 **"Create Backup"**（创建备份）

**文件备份：**
- 转换后的图片存储在对象存储中，Zeabur 自动备份

---

## 🔒 安全建议

### 1. 保护 API 密钥

- ❌ **不要** 将 API 密钥提交到 GitHub
- ✅ **使用** Zeabur 环境变量管理密钥
- ✅ **定期** 更换 API 密钥

### 2. 设置访问限制

- 在火山引擎、Gemini、Replicate 控制台中设置 IP 白名单
- 限制 API 调用频率，防止滥用

### 3. 监控使用量

- 定期检查 AI 调用量和成本
- 设置预算告警，避免超支

---

## 📈 性能优化

### 1. 启用 CDN

1. 在 Zeabur 项目页面，点击应用服务
2. 进入 **"Settings"** → **"CDN"**
3. 启用 CDN 加速

### 2. 数据库优化

- 定期清理历史记录，避免数据库过大
- 添加索引，提升查询速度

### 3. 图片压缩

- 在上传前压缩图片，减少存储成本
- 使用 WebP 格式，减少带宽消耗

---

## 🎉 部署完成！

恭喜您成功部署 StyleBatch 到 Zeabur！

**下一步：**
1. 访问您的应用域名，测试功能
2. 上传图片，测试风格转换
3. 查看历史记录，确认数据保存正常
4. 绑定自定义域名（可选）

**需要帮助？**
- Zeabur 文档：https://zeabur.com/docs
- GitHub Issues：https://github.com/paulbreath/stylebatch/issues

---

## 📞 技术支持

如果遇到问题，可以：
1. 查看 Zeabur 官方文档
2. 在 GitHub 仓库提交 Issue
3. 加入 Zeabur 社区寻求帮助

祝您使用愉快！🎨
