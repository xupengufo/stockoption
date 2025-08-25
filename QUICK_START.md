# 🚀 快速部署指南

## 最快部署方式（5分钟内完成）

### 1️⃣ 获取API密钥（2分钟）
1. 访问 [Polygon.io](https://polygon.io/pricing) 
2. 注册免费账号
3. 复制API密钥

### 2️⃣ 一键部署（3分钟）

**选择您的部署方式**：

#### 🏠 本地开发（推荐新手）
```bash
# 在项目目录运行
./deploy.sh

# 或者使用原有脚本
./start.sh
```

#### 🐳 Docker部署（推荐生产）
```bash
# 设置API密钥
cp .env.example .env
nano .env  # 编辑POLYGON_API_KEY

# 一键Docker部署
./deploy.sh docker
```

#### ☁️ 云端部署（推荐长期使用）
1. **Vercel部署**（免费）：
   - 将代码推送到GitHub
   - 访问 [vercel.com](https://vercel.com) 
   - 导入项目，设置环境变量`POLYGON_API_KEY`
   - 一键部署完成

### 3️⃣ 访问应用
- **本地开发**: http://localhost:3000
- **Docker**: http://localhost:3001  
- **Vercel**: 您的vercel域名

## 🔧 环境变量设置

创建`server/.env`文件：
```env
POLYGON_API_KEY=pk_你的密钥
PORT=3001
NODE_ENV=development
```

## 🧪 验证部署

运行测试脚本：
```bash
node test-api.js
```

## ❗ 常见问题

**Q: 端口被占用？**
```bash
# 查看占用进程
lsof -i :3001
# 杀死进程
kill -9 [进程ID]
```

**Q: API请求失败？**
- 检查API密钥是否正确
- 确认网络连接正常
- 验证Polygon.io账户状态

**Q: Docker启动失败？**
```bash
# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

---

🎉 **部署成功后，您就可以开始分析期权策略了！**

需要帮助？查看完整文档：[DEPLOYMENT.md](./DEPLOYMENT.md)