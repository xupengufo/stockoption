# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制根目录的package.json
COPY package*.json ./

# 安装根目录依赖
RUN npm install

# 复制服务器代码
COPY server/ ./server/
WORKDIR /app/server
RUN npm install

# 复制客户端代码并构建
WORKDIR /app
COPY client/ ./client/
WORKDIR /app/client
RUN npm install
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制服务器代码和依赖
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3001

# 暴露端口
EXPOSE 3001

# 启动服务器
CMD ["node", "server/index.js"]