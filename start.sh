#!/bin/bash

echo "🚀 启动美股期权卖方分析系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm未安装，请先安装npm"
    exit 1
fi

echo "📦 安装依赖..."
npm run install-all

echo "🔧 启动开发服务器..."
npm run dev