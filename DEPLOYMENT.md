# 🚀 美股期权分析系统部署指南

## 📋 部署前准备

### 1. 环境要求
- Node.js 16+ 
- npm 或 yarn
- Docker（可选）
- Git

### 2. 获取API密钥
1. 访问 [Polygon.io](https://polygon.io/) 注册账号
2. 获取免费API密钥
3. 复制API密钥备用

### 3. 环境变量配置

**服务器端配置**：
```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑环境变量文件
nano server/.env
```

在`server/.env`中设置：
```
POLYGON_API_KEY=你的polygon_api_密钥
PORT=3001
NODE_ENV=development
```

**客户端配置**：
```bash
# 复制环境变量模板
cp client/.env.example client/.env

# 如果需要修改API地址
nano client/.env
```

## 🏠 本地开发部署

### 方法一：使用启动脚本（推荐）
```bash
# 给脚本执行权限
chmod +x start.sh

# 运行启动脚本
./start.sh
```

### 方法二：手动启动
```bash
# 1. 安装所有依赖
npm run install-all

# 2. 启动开发服务器
npm run dev
```

### 方法三：分别启动前后端
```bash
# 终端1：启动后端
cd server && npm run dev

# 终端2：启动前端
cd client && npm start
```

**访问应用**：
- 前端：http://localhost:3000
- 后端API：http://localhost:3001

## 🐳 Docker部署

### 方法一：使用docker-compose（推荐）
```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑环境变量
nano .env

# 3. 启动容器
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

### 方法二：直接使用Docker
```bash
# 1. 构建镜像
docker build -t options-analyzer .

# 2. 运行容器
docker run -d \
  --name options-analyzer \
  -p 3001:3001 \
  -e POLYGON_API_KEY=你的API密钥 \
  -e NODE_ENV=production \
  options-analyzer

# 3. 查看日志
docker logs -f options-analyzer

# 4. 停止容器
docker stop options-analyzer
```

**访问应用**：http://localhost:3001

## ☁️ 云平台部署

### Vercel部署（推荐，免费）

1. **准备代码**：
   ```bash
   # 确保代码已提交到GitHub
   git add .
   git commit -m "准备部署到Vercel"
   git push origin main
   ```

2. **Vercel部署**：
   - 访问 [vercel.com](https://vercel.com)
   - 使用GitHub登录
   - 点击"New Project"
   - 选择您的stockWeb仓库
   - 配置环境变量：
     - `POLYGON_API_KEY`: 您的API密钥
   - 点击"Deploy"

3. **配置域名**（可选）：
   - 在Vercel项目设置中添加自定义域名

### Netlify部署

1. **构建前端**：
   ```bash
   cd client && npm run build
   ```

2. **部署到Netlify**：
   - 访问 [netlify.com](https://netlify.com)
   - 拖拽`client/build`文件夹到部署区域
   - 或连接GitHub仓库自动部署

### Heroku部署

1. **安装Heroku CLI**：
   ```bash
   # macOS
   brew install heroku/brew/heroku
   ```

2. **创建Heroku应用**：
   ```bash
   # 登录Heroku
   heroku login

   # 创建应用
   heroku create your-app-name

   # 设置环境变量
   heroku config:set POLYGON_API_KEY=你的API密钥
   heroku config:set NODE_ENV=production

   # 部署
   git push heroku main
   ```

## 🖥️ VPS/云服务器部署

### Ubuntu/CentOS服务器

1. **安装Node.js**：
   ```bash
   # Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # CentOS
   curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
   sudo yum install -y nodejs
   ```

2. **部署应用**：
   ```bash
   # 克隆代码
   git clone https://github.com/your-username/stockWeb.git
   cd stockWeb

   # 设置环境变量
   cp server/.env.example server/.env
   nano server/.env  # 编辑API密钥

   # 构建和启动
   npm run install-all
   cd client && npm run build
   cd ../server && NODE_ENV=production npm start
   ```

3. **使用PM2管理进程**：
   ```bash
   # 安装PM2
   npm install -g pm2

   # 启动应用
   cd server
   pm2 start index.js --name "options-analyzer"

   # 设置开机自启
   pm2 startup
   pm2 save
   ```

4. **配置Nginx反向代理**：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🧪 部署测试

部署完成后，测试API是否正常：

```bash
# 测试本地API
node test-api.js

# 测试生产API
curl https://your-domain.com/api/stock/AAPL
```

## 🔧 常见问题排查

### 1. 端口冲突
```bash
# 查看端口占用
lsof -i :3001

# 杀死进程
kill -9 进程ID
```

### 2. 权限问题
```bash
# 给启动脚本执行权限
chmod +x start.sh

# 修复npm权限
sudo chown -R $(whoami) ~/.npm
```

### 3. API密钥问题
- 确保API密钥正确设置
- 检查Polygon.io账户配额
- 验证网络连接

### 4. Docker问题
```bash
# 清理Docker缓存
docker system prune -a

# 重新构建镜像
docker-compose build --no-cache
```

## 📈 性能优化建议

1. **启用Gzip压缩**
2. **设置CDN加速**
3. **数据库缓存优化**
4. **API请求限流**
5. **监控和日志收集**

## 🔒 安全建议

1. **环境变量保护**：绝不将API密钥提交到代码仓库
2. **HTTPS配置**：生产环境必须使用HTTPS
3. **API限流**：防止API滥用
4. **定期更新依赖**：修复安全漏洞

---

如果遇到部署问题，请检查：
- 📋 环境变量是否正确设置
- 🔌 网络连接是否正常
- 🔑 API密钥是否有效
- 📦 依赖是否正确安装