# Zeabur 部署检查清单

## 📋 部署前准备

### 1. GitHub 仓库
- ✅ 代码已推送到 `paulbreath/stylebatch`
- ✅ 包含 `Dockerfile`
- ✅ 包含 `zbpack.json`（指向 Dockerfile）

### 2. Zeabur 项目配置
- ✅ 项目已创建并连接 GitHub 仓库
- ✅ MySQL 数据库服务已添加
- ✅ 环境变量已配置（22个）

---

## 🚀 部署步骤

### 步骤 1：触发重新部署
1. 进入 Zeabur 控制台
2. 选择您的项目
3. 点击 `stylebatch` 服务
4. 点击右上角 **"Redeploy"** 按钮

### 步骤 2：监控构建日志
1. 点击 **"Build Logs"** 标签
2. 确认以下步骤成功：
   ```
   ✅ Cloning repository...
   ✅ Building Docker image...
   ✅ Step 1/10 : FROM node:22-alpine
   ✅ Step 2/10 : WORKDIR /app
   ✅ Step 3/10 : RUN npm install -g pnpm
   ✅ Step 4/10 : COPY package.json pnpm-lock.yaml ./
   ✅ Step 5/10 : RUN pnpm install --frozen-lockfile
   ✅ Step 6/10 : COPY . .
   ✅ Step 7/10 : RUN pnpm build
   ✅ Step 8/10 : EXPOSE 8080
   ✅ Step 9/10 : ENV PORT=8080
   ✅ Step 10/10 : CMD ["node", "dist/index.js"]
   ✅ Successfully built image
   ✅ Pushing to registry...
   ```

### 步骤 3：检查运行日志
1. 点击 **"Runtime Logs"** 标签
2. 确认看到以下日志：
   ```
   ✅ [OAuth] Initialized with baseURL: https://api.manus.im
   ✅ Server running on http://localhost:8080/
   ```

### 步骤 4：测试访问
1. 点击 Zeabur 提供的域名链接
2. 确认网站正常加载
3. 测试登录功能
4. 测试图片转换功能

---

## ❌ 常见问题排查

### 问题 1：构建失败
**症状**：Build Logs 显示错误
**排查步骤**：
1. 检查 `package.json` 中的依赖是否正确
2. 检查 `pnpm-lock.yaml` 是否存在
3. 检查 Dockerfile 语法是否正确

### 问题 2：容器启动失败
**症状**：Runtime Logs 没有应用日志，只有 Caddy 日志
**排查步骤**：
1. 检查 `dist/index.js` 是否正确生成
2. 检查环境变量 `DATABASE_URL` 是否正确注入
3. 检查端口配置（应该使用 8080）

### 问题 3：数据库连接失败
**症状**：Runtime Logs 显示数据库连接错误
**排查步骤**：
1. 检查 MySQL 服务是否正常运行
2. 检查 `DATABASE_URL` 环境变量格式
3. 确认数据库迁移是否已运行

### 问题 4：OAuth 登录失败
**症状**：点击登录按钮无反应或跳转失败
**排查步骤**：
1. 检查 `OAUTH_SERVER_URL` 环境变量
2. 检查 `VITE_OAUTH_PORTAL_URL` 环境变量
3. 检查 `JWT_SECRET` 是否配置

---

## 🔧 环境变量检查

### 必需的环境变量（22个）
```bash
# 数据库
DATABASE_URL=mysql://...

# JWT
JWT_SECRET=...

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_APP_ID=...

# AI API Keys
GEMINI_API_KEY=...
REPLICATE_API_TOKEN=...
VOLCENGINE_ACCESS_KEY=...
VOLCENGINE_SECRET_KEY=...
VOLCENGINE_ARK_API_KEY=...

# Manus 内置 API
BUILT_IN_FORGE_API_KEY=...
BUILT_IN_FORGE_API_URL=...
VITE_FRONTEND_FORGE_API_KEY=...
VITE_FRONTEND_FORGE_API_URL=...

# 应用配置
VITE_APP_TITLE=StyleBatch
VITE_APP_LOGO=...
OWNER_NAME=...
OWNER_OPEN_ID=...

# 分析
VITE_ANALYTICS_ENDPOINT=...
VITE_ANALYTICS_WEBSITE_ID=...
```

---

## 📊 成功部署的标志

✅ **构建日志**：显示 "Successfully built image"
✅ **运行日志**：显示 "Server running on http://localhost:8080/"
✅ **网站访问**：可以正常打开首页
✅ **登录功能**：可以正常登录
✅ **转换功能**：可以正常上传和转换图片

---

## 🆘 如果仍然失败

如果按照以上步骤仍然无法部署成功，请提供以下信息：

1. **Build Logs 的完整输出**（特别是错误信息）
2. **Runtime Logs 的完整输出**（特别是启动日志）
3. **环境变量列表**（不需要提供具体值，只需要确认是否都配置了）

我会根据这些信息进一步排查问题！
