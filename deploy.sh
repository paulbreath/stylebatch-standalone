#!/bin/bash

# StyleBatch 部署脚本
# 用于快速部署应用到腾讯云服务器

set -e  # 遇到错误立即退出

echo "======================================"
echo "  StyleBatch 部署脚本"
echo "======================================"
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误：请在项目根目录运行此脚本"
    exit 1
fi

# 拉取最新代码
echo "[1/5] 拉取最新代码..."
git pull origin main || {
    echo "警告：Git pull 失败，继续使用本地代码"
}

# 安装依赖
echo ""
echo "[2/5] 安装依赖..."
pnpm install

# 运行数据库迁移
echo ""
echo "[3/5] 运行数据库迁移..."
pnpm db:push

# 构建应用
echo ""
echo "[4/5] 构建应用..."
pnpm build

# 重启应用
echo ""
echo "[5/5] 重启应用..."
pm2 restart stylebatch || pm2 start npm --name "stylebatch" -- start

# 保存 PM2 配置
pm2 save

echo ""
echo "======================================"
echo "  部署完成！"
echo "======================================"
echo ""
echo "查看应用状态："
pm2 status

echo ""
echo "查看应用日志："
echo "  pm2 logs stylebatch"
