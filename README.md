# 美股期权卖方分析系统

一个基于React和Node.js的美股期权卖方推荐和筛选分析网站，集成Polygon.io API提供实时数据。

## 🎯 功能特性

- 📊 期权链数据获取和分析
- 🎯 期权卖方策略推荐
- 📈 实时Greeks计算
- ⚠️ 风险评估和筛选
- 💰 收益率分析
- 📱 响应式设计
- 🔄 实时数据缓存

## 🛠 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Node.js + Express
- **数据源**: Polygon.io API
- **缓存**: Node-Cache
- **部署**: 支持Vercel/Netlify/Docker

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）
```bash
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
# 启动后端服务器
cd server && npm run dev

# 启动前端应用（新终端）
cd client && npm start
```

## 📋 环境配置

### 服务器环境变量 (server/.env)
```
POLYGON_API_KEY=WxoSPY6czjweSx5etNSSF82S7tps0Nfn
PORT=3001
```

### 客户端环境变量 (client/.env)
```
REACT_APP_API_URL=http://localhost:3001
```

## 🎮 使用说明

1. **选择股票代码**: 输入要分析的股票代码（如AAPL、TSLA等）
2. **选择策略**: 从下拉菜单中选择期权卖方策略
3. **设置风险承受度**: 选择保守型、稳健型或激进型
4. **开始分析**: 点击"开始分析"按钮获取推荐

## 📊 支持的期权策略

- 🛡️ **现金担保看跌期权** - 适合看好股票的投资者
- 📈 **备兑看涨期权** - 持有股票时的收益增强策略
- ⚡ **裸卖看跌期权** - 高风险高收益策略
- 🔥 **裸卖看涨期权** - 极高风险策略
- 🦅 **铁鹰策略** - 中性市场策略
- 🎯 **宽跨式策略** - 波动率策略

## 🚢 部署方式

### Vercel部署（推荐）
1. Fork此项目到你的GitHub
2. 在Vercel中导入项目
3. 设置环境变量`POLYGON_API_KEY`
4. 部署完成

### Docker部署
```bash
# 构建镜像
docker build -t options-analyzer .

# 运行容器
docker run -p 3001:3001 -e POLYGON_API_KEY=your_api_key options-analyzer

# 或使用docker-compose
docker-compose up -d
```

### 传统服务器部署
```bash
# 构建前端
cd client && npm run build

# 启动生产服务器
cd ../server && NODE_ENV=production npm start
```

## 📁 项目结构

```
├── client/                 # React前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── types/         # TypeScript类型定义
│   │   └── ...
│   └── package.json
├── server/                 # Node.js后端服务
│   ├── index.js           # 服务器入口文件
│   └── package.json
├── vercel.json            # Vercel部署配置
├── Dockerfile             # Docker配置
├── docker-compose.yml     # Docker Compose配置
└── README.md
```

## 🔧 API接口

### 获取期权数据
```
GET /api/options/:symbol?expiration_date=YYYY-MM-DD
```

### 获取股票数据
```
GET /api/stock/:symbol
```

### 策略分析
```
POST /api/analyze
{
  "symbol": "AAPL",
  "strategy": "cash-secured-put",
  "riskTolerance": "moderate"
}
```

## ⚠️ 风险提示

本系统仅供教育和研究目的使用。期权交易存在重大风险，可能导致全部投资损失。使用前请：

- 充分了解期权交易风险
- 确保具备相应的风险承受能力
- 咨询专业的投资顾问
- 不要投入超过承受能力的资金

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个项目！