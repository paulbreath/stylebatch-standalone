# StyleBatch 独立版本 - 快速部署指南

## 🎯 版本说明

这是 **StyleBatch 独立版本**，已移除 Manus 平台依赖，支持香港等地区用户访问。

**GitHub 仓库**：https://github.com/paulbreath/stylebatch-standalone

---

## ⚡ 5分钟快速部署

### 步骤 1：准备 Cloudflare R2（2分钟）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2 Object Storage**
3. 创建存储桶：名称 `stylebatch`
4. 创建 API Token（权限：Edit）
5. 记录以下信息：
   - Account ID
   - Access Key ID
   - Secret Access Key

### 步骤 2：在 Zeabur 部署（3分钟）

1. 登录 [Zeabur](https://zeabur.com/)
2. 创建新项目
3. 选择 **Import from GitHub**
4. 选择仓库：`paulbreath/stylebatch-standalone`
5. 添加 **MySQL** 服务
6. 配置环境变量（见下方）
7. 点击 **Deploy**

### 步骤 3：配置环境变量

在 Zeabur 项目设置中添加以下环境变量：

#### 必需的环境变量（最少配置）

```bash
# JWT 密钥（生成一个随机字符串）
JWT_SECRET=your-random-secret-key-at-least-32-characters

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=stylebatch

# AI API Keys（至少配置一个）
VOLCENGINE_ACCESS_KEY=your-volcengine-access-key
VOLCENGINE_SECRET_KEY=your-volcengine-secret-key
VOLCENGINE_ARK_API_KEY=your-volcengine-ark-api-key
```

#### 可选的环境变量（更多功能）

```bash
# Nano Banana 模型
REPLICATE_API_TOKEN=your-replicate-token

# Seedream 4.5 模型
GEMINI_API_KEY=your-gemini-api-key

# R2 自定义域名（可选）
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### 步骤 4：运行数据库迁移

部署成功后，在 Zeabur 控制台的 Terminal 中执行：

```bash
pnpm db:push
```

---

## ✅ 验证部署

1. 打开 Zeabur 提供的域名
2. 点击 **登录** → **注册**
3. 创建新账号
4. 上传图片测试转换功能

---

## 🔑 环境变量获取指南

### JWT_SECRET

生成一个随机字符串（至少32位）：

```bash
# 在终端执行
openssl rand -base64 32
```

或使用在线生成器：https://randomkeygen.com/

### Cloudflare R2

1. 登录 Cloudflare Dashboard
2. 进入 **R2 Object Storage**
3. 创建存储桶和 API Token
4. 复制 Account ID、Access Key ID、Secret Access Key

### 火山引擎 API

1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 进入 **访问控制** → **密钥管理**
3. 创建 Access Key
4. 进入 **ARK** → **API 密钥**
5. 创建 ARK API Key

### Replicate API（可选）

1. 登录 [Replicate](https://replicate.com/)
2. 进入 **Account Settings** → **API Tokens**
3. 创建新的 API Token

### Gemini API（可选）

1. 登录 [Google AI Studio](https://aistudio.google.com/)
2. 点击 **Get API Key**
3. 创建新的 API Key

---

## 💰 成本估算

### 免费额度

- **Cloudflare R2**：10GB 存储 + 1000万次读取/月
- **Zeabur**：有免费额度（具体查看官网）

### 付费成本

- **Zeabur**：约 ¥5/月（应用服务器）
- **Cloudflare R2**：约 ¥10-20/月（超出免费额度后）
- **AI 调用**：按使用量计费
  - 火山引擎：¥0.06/张（成本），¥0.1/张（用户价格）
  - Nano Banana：¥0.28/张（成本），¥0.4/张（用户价格）
  - Seedream 4.5：¥0.25/张（成本），¥0.35/张（用户价格）

**总成本**：约 ¥605-625/月（假设每天转换100张）

---

## 🐛 常见问题

### 问题 1：部署失败

**解决方案**：
1. 检查 Build Logs 查看错误信息
2. 确认所有必需的环境变量已配置
3. 确认 Dockerfile 和 zbpack.json 存在

### 问题 2：数据库连接失败

**解决方案**：
1. 确认 MySQL 服务已添加并运行
2. 确认 `DATABASE_URL` 已自动注入
3. 运行 `pnpm db:push` 创建表结构

### 问题 3：图片上传失败

**解决方案**：
1. 确认 R2 环境变量配置正确
2. 确认 R2 API Token 权限为 **Edit**
3. 确认存储桶名称正确

### 问题 4：用户注册失败

**解决方案**：
1. 确认 `JWT_SECRET` 已配置
2. 确认数据库迁移已运行
3. 检查邮箱格式是否正确（必须是有效的邮箱格式）

---

## 📚 详细文档

- [完整部署文档](./docs/DEPLOYMENT.md)
- [项目 README](./README.md)
- [GitHub 仓库](https://github.com/paulbreath/stylebatch-standalone)

---

## 🆘 需要帮助？

如果遇到问题，请提供以下信息：

1. **Build Logs**：构建日志的完整输出
2. **Runtime Logs**：运行日志的完整输出
3. **环境变量列表**：确认所有必需的环境变量已配置
4. **错误截图**：前端或后端的错误信息

在 GitHub 仓库提交 Issue：https://github.com/paulbreath/stylebatch-standalone/issues

---

## 🎉 部署成功！

恭喜！您已成功部署 StyleBatch 独立版本。

**下一步**：
1. 配置自定义域名（可选）
2. 设置 SSL 证书（Zeabur 自动配置）
3. 监控服务状态和日志
4. 定期备份数据库

享受您的 AI 图片转换服务吧！🚀
