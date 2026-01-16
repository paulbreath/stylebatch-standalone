# StyleBatch 独立版本部署指南

## 🎯 版本说明

这是 StyleBatch 的**独立版本**，移除了 Manus 平台依赖，支持香港等地区用户访问。

**主要变更**：
- ✅ 独立的用户注册/登录系统（邮箱+密码）
- ✅ Cloudflare R2 对象存储（替代 Manus S3）
- ✅ Zeabur MySQL 数据库
- ✅ 保留所有 AI 转换功能（4个模型）

---

## 📋 部署前准备

### 1. Cloudflare R2 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **R2 Object Storage**
3. 创建存储桶（Bucket）：
   - 名称：`stylebatch`（或自定义）
   - 位置：自动（全球分布）

4. 创建 API Token：
   - 进入 **Manage R2 API Tokens**
   - 点击 **Create API Token**
   - 权限：**Edit** (读写权限)
   - 保存以下信息：
     - Account ID
     - Access Key ID
     - Secret Access Key

5. （可选）配置自定义域名：
   - 进入存储桶设置
   - 添加自定义域名（如 `cdn.yourdomain.com`）
   - 配置 DNS CNAME 记录

### 2. Zeabur 项目配置

1. 登录 [Zeabur](https://zeabur.com/)
2. 创建新项目
3. 连接 GitHub 仓库：`stylebatch-standalone`
4. 添加 MySQL 数据库服务

---

## 🔧 环境变量配置

在 Zeabur 项目中配置以下环境变量：

### 必需的环境变量

```bash
# 数据库（Zeabur 自动注入）
DATABASE_URL=mysql://...

# JWT 密钥（生成一个随机字符串）
JWT_SECRET=your-random-secret-key-change-this

# Cloudflare R2 配置
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=stylebatch
R2_PUBLIC_URL=https://cdn.yourdomain.com  # 可选，自定义域名

# AI API Keys
GEMINI_API_KEY=your-gemini-api-key
REPLICATE_API_TOKEN=your-replicate-api-token
VOLCENGINE_ACCESS_KEY=your-volcengine-access-key
VOLCENGINE_SECRET_KEY=your-volcengine-secret-key
VOLCENGINE_ARK_API_KEY=your-volcengine-ark-api-key
```

### 环境变量说明

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DATABASE_URL` | MySQL 连接字符串 | Zeabur 自动注入 |
| `JWT_SECRET` | JWT 签名密钥 | 生成随机字符串（至少32位） |
| `R2_ACCOUNT_ID` | Cloudflare 账号 ID | R2 控制台 |
| `R2_ACCESS_KEY_ID` | R2 访问密钥 ID | 创建 API Token 时获取 |
| `R2_SECRET_ACCESS_KEY` | R2 访问密钥 | 创建 API Token 时获取 |
| `R2_BUCKET_NAME` | R2 存储桶名称 | 创建存储桶时设置 |
| `R2_PUBLIC_URL` | 自定义域名（可选） | 配置自定义域名后获取 |
| `GEMINI_API_KEY` | Google Gemini API 密钥 | [Google AI Studio](https://aistudio.google.com/) |
| `REPLICATE_API_TOKEN` | Replicate API Token | [Replicate](https://replicate.com/) |
| `VOLCENGINE_ACCESS_KEY` | 火山引擎 Access Key | [火山引擎控制台](https://console.volcengine.com/) |
| `VOLCENGINE_SECRET_KEY` | 火山引擎 Secret Key | 火山引擎控制台 |
| `VOLCENGINE_ARK_API_KEY` | 火山引擎 ARK API Key | 火山引擎控制台 |

---

## 🚀 部署步骤

### 步骤 1：推送代码到 GitHub

```bash
cd /home/ubuntu/stylebatch-standalone
git init
git add .
git commit -m "Initial commit: StyleBatch standalone version"
gh repo create stylebatch-standalone --public --source=. --remote=origin --push
```

### 步骤 2：在 Zeabur 创建项目

1. 登录 Zeabur
2. 点击 **New Project**
3. 选择 **Import from GitHub**
4. 选择 `stylebatch-standalone` 仓库
5. Zeabur 会自动检测项目类型（Node.js）

### 步骤 3：添加 MySQL 数据库

1. 在项目中点击 **Add Service**
2. 选择 **MySQL**
3. Zeabur 会自动创建数据库并注入 `DATABASE_URL`

### 步骤 4：配置环境变量

1. 点击服务设置
2. 进入 **Environment Variables** 标签
3. 添加上述所有环境变量

### 步骤 5：部署

1. 点击 **Deploy** 按钮
2. 等待构建完成（约 3-5 分钟）
3. 查看 **Build Logs** 确认构建成功
4. 查看 **Runtime Logs** 确认应用启动成功

### 步骤 6：运行数据库迁移

部署成功后，需要运行数据库迁移创建表结构：

```bash
# 在 Zeabur 控制台的 Terminal 中执行
pnpm db:push
```

或者在本地连接到 Zeabur MySQL 执行迁移：

```bash
# 从 Zeabur 获取 DATABASE_URL
export DATABASE_URL="mysql://..."
pnpm db:push
```

---

## ✅ 部署验证

### 1. 检查服务状态

- Zeabur 显示服务状态为 **Running**
- Runtime Logs 显示：
  ```
  Server running on http://localhost:8080/
  ```

### 2. 测试网站访问

1. 打开 Zeabur 提供的域名
2. 确认首页正常加载
3. 点击 **登录** 按钮
4. 测试注册新账号
5. 测试登录功能

### 3. 测试核心功能

1. 上传图片
2. 选择风格
3. 转换图片
4. 查看历史记录

---

## 🔧 常见问题

### 问题 1：数据库连接失败

**症状**：Runtime Logs 显示数据库连接错误

**解决方案**：
1. 确认 MySQL 服务正常运行
2. 确认 `DATABASE_URL` 环境变量正确注入
3. 检查数据库迁移是否已运行

### 问题 2：图片上传失败

**症状**：上传图片时报错

**解决方案**：
1. 确认 R2 环境变量配置正确
2. 确认 R2 API Token 权限为 **Edit**
3. 确认 R2 存储桶名称正确

### 问题 3：用户注册失败

**症状**：注册时报错

**解决方案**：
1. 确认 `JWT_SECRET` 环境变量已配置
2. 确认数据库表已创建（运行 `pnpm db:push`）
3. 检查邮箱格式是否正确

### 问题 4：AI 转换失败

**症状**：转换图片时报错

**解决方案**：
1. 确认 AI API Keys 配置正确
2. 确认 API 账号有足够的额度
3. 查看 Runtime Logs 中的详细错误信息

---

## 💰 成本估算

### Zeabur 费用

| 服务 | 配置 | 价格 |
|------|------|------|
| 应用服务器 | 共享集群 | ¥5/月 |
| MySQL 数据库 | 1GB 存储 | ¥0（免费额度） |
| **小计** | | **¥5/月** |

### Cloudflare R2 费用

| 项目 | 免费额度 | 超出费用 |
|------|----------|----------|
| 存储空间 | 10GB | $0.015/GB/月 |
| Class A 操作（写入） | 100万次/月 | $4.50/百万次 |
| Class B 操作（读取） | 1000万次/月 | $0.36/百万次 |

**预估**：前期免费，后期约 ¥10-20/月

### AI API 费用

| 模型 | 成本 | 用户价格 | 备注 |
|------|------|----------|------|
| 火山引擎 | ¥0.06/张 | ¥0.1/张 | 11种预设风格 |
| Nano Banana | ¥0.28/张 | ¥0.4/张 | 自定义描述 |
| Seedream 4.5 | ¥0.25/张 | ¥0.35/张 | 4K高清 |

**预估**：根据使用量计算，约 ¥600/月（假设每天转换100张）

### 总成本

- **基础设施**：¥5-25/月
- **AI 调用**：¥600/月（根据使用量）
- **总计**：约 ¥605-625/月

---

## 🔒 安全建议

1. **JWT_SECRET**：使用强随机字符串，定期更换
2. **API Keys**：不要在代码中硬编码，使用环境变量
3. **数据库**：启用 SSL 连接
4. **R2 存储桶**：配置合适的访问权限
5. **密码策略**：强制用户使用强密码（至少6位）

---

## 📚 相关文档

- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Zeabur 文档](https://zeabur.com/docs)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

---

## 🆘 技术支持

如果遇到问题，请提供以下信息：

1. **Build Logs**：构建日志的完整输出
2. **Runtime Logs**：运行日志的完整输出
3. **环境变量列表**：确认所有必需的环境变量已配置
4. **错误截图**：前端或后端的错误信息

---

## 🎉 部署成功！

恭喜！您已成功部署 StyleBatch 独立版本。

**下一步**：
1. 配置自定义域名（可选）
2. 设置 SSL 证书（Zeabur 自动配置）
3. 配置 CDN 加速（Cloudflare 自动配置）
4. 监控服务状态和日志
5. 定期备份数据库

享受您的 AI 图片转换服务吧！🚀
