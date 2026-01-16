# StyleBatch - 批量图片风格转换工具

基于多个 AI 模型的在线图片风格转换工具，支持单张和批量处理。

## ✨ 功能特点

- **多模型支持**：集成火山引擎、Seedream 4.5、Nano Banana 三个 AI 模型
- **单张转换**：支持预设风格和自定义描述
- **批量转换**：一次上传多张图片，批量处理
- **历史记录**：保存转换历史，支持提示词复用
- **全屏预览**：高清图片全屏查看
- **一键下载**：保留原始文件名

## 🤖 AI 模型对比

| 模型 | 价格 | 特点 | 速度 |
|------|------|------|------|
| 火山引擎 | ¥0.1/张 | 11种预设风格 | 快速 |
| Seedream 4.5 | ¥0.35/张 | 4K高清，文字渲染好 | 60秒 |
| Nano Banana | ¥0.4/张 | Gemini 2.5 Flash，理解上下文 | 10秒 |

## 🛠️ 技术栈

- **前端**：React 19 + TypeScript + Vite + Tailwind CSS 4
- **后端**：Node.js + Express + tRPC
- **数据库**：TiDB (MySQL 兼容)
- **存储**：S3 兼容对象存储
- **AI 模型**：火山引擎 ARK API、Seedream API、Replicate API

## 📦 环境变量

需要配置以下环境变量：

```bash
# 数据库
DATABASE_URL=mysql://...

# 火山引擎
VOLCENGINE_ARK_API_KEY=your_ark_api_key
VOLCENGINE_ACCESS_KEY=your_access_key
VOLCENGINE_SECRET_KEY=your_secret_key

# Seedream
GEMINI_API_KEY=your_gemini_api_key

# Replicate (Nano Banana)
REPLICATE_API_TOKEN=your_replicate_token

# JWT
JWT_SECRET=your_jwt_secret

# OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=your_app_id

# 前端配置
VITE_APP_TITLE=StyleBatch
VITE_APP_LOGO=/logo.png
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 数据库迁移

```bash
pnpm db:push
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
pnpm build
pnpm start
```

## 📁 项目结构

```
stylebatch-web/
├── client/               # 前端代码
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── components/  # UI 组件
│   │   └── lib/         # 工具函数
├── server/              # 后端代码
│   ├── routers.ts       # tRPC 路由
│   ├── db.ts            # 数据库查询
│   └── services/        # AI 模型服务
├── drizzle/             # 数据库 Schema
├── shared/              # 共享类型和常量
└── docs/                # 文档
```

## 📝 API 文档

### 火山引擎 API

- 推理接入点：`ep-20260115185033-xqmqh`
- 支持 11 种预设风格
- 成本：¥0.06/张

### Seedream 4.5 API

- 推理接入点：`ep-20260116122351-2tlgl`
- 固定 4K 分辨率（4992x3328）
- 成本：¥0.25/张

### Nano Banana API

- Replicate 模型：`google/nano-banana`
- Gemini 2.5 Flash 驱动
- 成本：¥0.28/张

## 🔒 安全说明

- 所有 API 密钥通过环境变量管理
- 用户上传的图片存储在对象存储中
- 支持用户认证和授权

## 📄 许可证

MIT License

## 👨‍💻 开发者

基于 Manus 平台开发
