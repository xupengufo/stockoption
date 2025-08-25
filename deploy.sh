#!/bin/bash

# 美股期权分析系统一键部署脚本
# 支持本地开发、Docker、生产环境部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

print_success() {
    print_message "✅ $1" "$GREEN"
}

print_warning() {
    print_message "⚠️  $1" "$YELLOW"
}

print_error() {
    print_message "❌ $1" "$RED"
}

print_info() {
    print_message "ℹ️  $1" "$BLUE"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查Node.js版本
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
        if [ "$MAJOR_VERSION" -ge 16 ]; then
            print_success "Node.js版本: v$NODE_VERSION ✓"
            return 0
        else
            print_error "Node.js版本过低 (当前: v$NODE_VERSION, 需要: >=16.x)"
            return 1
        fi
    else
        print_error "Node.js未安装"
        return 1
    fi
}

# 设置环境变量
setup_env() {
    print_info "设置环境变量..."
    
    # 设置服务器环境变量
    if [ ! -f "server/.env" ]; then
        if [ -f "server/.env.example" ]; then
            cp server/.env.example server/.env
            print_warning "请编辑 server/.env 文件，设置您的 POLYGON_API_KEY"
            print_info "您可以从 https://polygon.io 获取免费API密钥"
        else
            print_error "server/.env.example 文件不存在"
        fi
    else
        print_success "server/.env 已存在"
    fi
    
    # 设置客户端环境变量
    if [ ! -f "client/.env" ]; then
        if [ -f "client/.env.example" ]; then
            cp client/.env.example client/.env
            print_success "客户端环境变量已设置"
        fi
    else
        print_success "client/.env 已存在"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."
    
    # 安装根目录依赖
    print_info "安装根目录依赖..."
    npm install
    
    # 安装服务器依赖
    print_info "安装服务器依赖..."
    cd server && npm install && cd ..
    
    # 安装客户端依赖
    print_info "安装客户端依赖..."
    cd client && npm install && cd ..
    
    print_success "所有依赖安装完成"
}

# 本地开发部署
deploy_development() {
    print_info "启动本地开发环境..."
    
    # 检查端口是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "端口3000已被占用，前端可能需要使用其他端口"
    fi
    
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "端口3001已被占用，后端可能需要使用其他端口"
    fi
    
    print_success "启动开发服务器..."
    print_info "前端地址: http://localhost:3000"
    print_info "后端API: http://localhost:3001"
    print_info "按 Ctrl+C 停止服务器"
    
    npm run dev
}

# Docker部署
deploy_docker() {
    if ! command_exists docker; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    print_info "使用Docker部署..."
    
    # 设置Docker环境变量
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "请编辑 .env 文件，设置您的 POLYGON_API_KEY"
        fi
    fi
    
    # 检查docker-compose
    if command_exists docker-compose; then
        print_info "使用docker-compose启动..."
        docker-compose up -d
        print_success "Docker容器已启动"
        print_info "应用地址: http://localhost:3001"
        print_info "查看日志: docker-compose logs -f"
        print_info "停止服务: docker-compose down"
    else
        print_info "使用Docker命令启动..."
        docker build -t options-analyzer .
        docker run -d --name options-analyzer -p 3001:3001 --env-file .env options-analyzer
        print_success "Docker容器已启动"
        print_info "应用地址: http://localhost:3001"
        print_info "查看日志: docker logs -f options-analyzer"
        print_info "停止容器: docker stop options-analyzer"
    fi
}

# 生产部署
deploy_production() {
    print_info "构建生产版本..."
    
    # 构建前端
    print_info "构建前端应用..."
    cd client && npm run build && cd ..
    
    # 设置生产环境变量
    export NODE_ENV=production
    
    print_success "生产版本构建完成"
    print_info "启动生产服务器..."
    print_info "应用地址: http://localhost:3001"
    
    cd server && npm start
}

# 测试API
test_api() {
    print_info "测试API连接..."
    if [ -f "test-api.js" ]; then
        node test-api.js
    else
        print_warning "test-api.js 文件不存在，跳过API测试"
    fi
}

# 显示帮助信息
show_help() {
    echo ""
    echo "🚀 美股期权分析系统部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  dev, development    启动本地开发环境（默认）"
    echo "  docker             使用Docker部署"
    echo "  prod, production   生产环境部署"
    echo "  install            只安装依赖"
    echo "  env                只设置环境变量"
    echo "  test               测试API连接"
    echo "  help               显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                 # 默认启动开发环境"
    echo "  $0 dev             # 启动开发环境"
    echo "  $0 docker          # 使用Docker部署"
    echo "  $0 prod            # 生产环境部署"
    echo ""
}

# 主函数
main() {
    print_info "美股期权分析系统部署脚本"
    print_info "============================="
    
    # 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi
    
    # 检查Node.js
    if ! check_node_version; then
        print_error "请安装Node.js 16+版本"
        print_info "访问 https://nodejs.org 下载安装"
        exit 1
    fi
    
    # 根据参数执行相应操作
    case "${1:-dev}" in
        "dev"|"development")
            setup_env
            install_dependencies
            deploy_development
            ;;
        "docker")
            deploy_docker
            ;;
        "prod"|"production")
            setup_env
            install_dependencies
            deploy_production
            ;;
        "install")
            install_dependencies
            ;;
        "env")
            setup_env
            ;;
        "test")
            test_api
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"