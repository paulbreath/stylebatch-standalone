# Zeabur 环境变量配置指南

## 📋 必需的环境变量

### 1. 基础配置（已生成）

```bash
# JWT 密钥（用于会话加密）
JWT_SECRET=TZm/8xa/sASSxFA/x96hfFsO6itsLCl9GsaXjnnp5uk=

# 应用 ID
VITE_APP_ID=96de1025-94b0-418b-ac9f-49380b1b2de7

# 所有者 OpenID（可以设置为任意值）
OWNER_OPEN_ID=admin

# Node 环境
NODE_ENV=production
```

### 2. OAuth 配置（暂时禁用）

由于没有 Manus OAuth 服务，我们暂时设置为空值：

```bash
# OAuth 服务器地址（留空）
OAUTH_SERVER_URL=

# Forge API（留空）
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
```

### 3. AI 服务配置（需要注册获取）

#### 3.1 火山引擎（必需）

**注册地址：** https://www.volcengine.com/

**步骤：**
1. 注册火山引擎账号
2. 进入控制台 → 访问控制 → 访问密钥
3. 创建新的访问密钥
4. 获取 Access Key ID 和 Secret Access Key

```bash
VOLCENGINE_ACCESS_KEY=你的AccessKeyID
VOLCENGINE_SECRET_KEY=你的SecretAccessKey
```

**开通服务：**
- 视觉智能平台（图像处理）
- ARK 平台（AI 模型）

```bash
VOLCENGINE_ARK_API_KEY=你的ARK_API_KEY
```

#### 3.2 Replicate（必需）

**注册地址：** https://replicate.com/

**步骤：**
1. 注册 Replicate 账号
2. 进入 Account Settings → API Tokens
3. 创建新的 API Token

```bash
REPLICATE_API_TOKEN=你的Replicate_API_Token
```

**费用：**
- 按使用量计费
- 大约 $0.01-0.05 每次图片转换

---

## 🔧 在 Zeabur 中配置

### 步骤 1：进入服务设置

1. 在 Zeabur 项目页面，点击 **stylebatch** 服务
2. 点击顶部的 **"环境变量"** 标签

### 步骤 2：添加环境变量

逐个添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `JWT_SECRET` | `TZm/8xa/sASSxFA/x96hfFsO6itsLCl9GsaXjnnp5uk=` | JWT 密钥 |
| `VITE_APP_ID` | `96de1025-94b0-418b-ac9f-49380b1b2de7` | 应用 ID |
| `OWNER_OPEN_ID` | `admin` | 管理员 ID |
| `NODE_ENV` | `production` | 生产环境 |
| `OAUTH_SERVER_URL` | ` ` | 留空 |
| `BUILT_IN_FORGE_API_URL` | ` ` | 留空 |
| `BUILT_IN_FORGE_API_KEY` | ` ` | 留空 |
| `VOLCENGINE_ACCESS_KEY` | `待填写` | 火山引擎密钥 |
| `VOLCENGINE_SECRET_KEY` | `待填写` | 火山引擎密钥 |
| `VOLCENGINE_ARK_API_KEY` | `待填写` | ARK API 密钥 |
| `REPLICATE_API_TOKEN` | `待填写` | Replicate 令牌 |

### 步骤 3：保存并重新部署

1. 点击 **"保存"** 按钮
2. 点击 **"重新部署"** 按钮
3. 等待部署完成（约 3-5 分钟）

---

## ⚠️ 注意事项

### 1. OAuth 功能暂时不可用

由于没有 Manus OAuth 服务，以下功能暂时无法使用：
- 用户登录/注册
- 用户认证

**解决方案：**
- 后续可以集成第三方 OAuth（Google、GitHub 等）
- 或者实现简单的本地认证

### 2. 数据库已自动配置

Zeabur 已经自动注入了 `DATABASE_URL`，无需手动配置。

### 3. API 密钥安全

- 不要在代码中硬编码 API 密钥
- 不要将 API 密钥提交到 GitHub
- 定期更换 API 密钥

---

## 💰 成本预估

### 火山引擎
- 视觉智能：按调用次数计费
- 预估：¥0.1-0.5 每次图片处理
- 新用户有免费额度

### Replicate
- 按使用量计费
- 预估：$0.01-0.05 每次图片转换
- 约 ¥0.07-0.35 每次

### Zeabur
- 共享集群：$0.007/小时
- 预估：$5-10/月（约 ¥35-70）

**总计：** 约 ¥40-100/月（取决于使用量）

---

## 📞 获取帮助

如果在配置过程中遇到问题：
1. 检查环境变量是否正确填写
2. 查看 Zeabur 运行时日志
3. 确认 API 密钥是否有效

---

## ✅ 配置完成后

1. 访问 Zeabur 分配的域名
2. 测试图片上传和转换功能
3. 查看日志确认服务正常运行
