const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // 5分钟缓存

app.use(cors());
app.use(express.json());

// 在生产环境中提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

const POLYGON_API_KEY = process.env.POLYGON_API_KEY || 'WxoSPY6czjweSx5etNSSF82S7tps0Nfn';
const POLYGON_BASE_URL = 'https://api.polygon.io';

// 获取期权链数据
app.get('/api/options/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { expiration_date } = req.query;
    
    const cacheKey = `options_${symbol}_${expiration_date}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${POLYGON_BASE_URL}/v3/reference/options/contracts`,
      {
        params: {
          underlying_ticker: symbol,
          expiration_date,
          limit: 1000,
          apikey: POLYGON_API_KEY
        }
      }
    );

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('获取期权数据错误:', error.message);
    res.status(500).json({ error: '获取期权数据失败' });
  }
});

// 获取股票当前价格
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const cacheKey = `stock_${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    const response = await axios.get(
      `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`,
      {
        params: {
          adjusted: true,
          apikey: POLYGON_API_KEY
        }
      }
    );

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error('获取股票数据错误:', error.message);
    res.status(500).json({ error: '获取股票数据失败' });
  }
});

// 期权卖方策略分析
app.post('/api/analyze', async (req, res) => {
  try {
    const { symbol, strategy, riskTolerance } = req.body;
    
    // 这里实现期权卖方策略分析逻辑
    const analysis = {
      symbol,
      strategy,
      recommendations: [
        {
          type: 'PUT',
          strike: 450,
          expiration: '2024-02-16',
          premium: 12.50,
          probability: 0.75,
          maxProfit: 1250,
          maxLoss: -43750,
          breakeven: 437.50,
          annualizedReturn: 0.28
        }
      ],
      riskMetrics: {
        maxDrawdown: 0.15,
        sharpeRatio: 1.2,
        winRate: 0.68
      }
    };
    
    res.json(analysis);
  } catch (error) {
    console.error('分析错误:', error.message);
    res.status(500).json({ error: '分析失败' });
  }
});

// 在生产环境中，所有非API路由都返回React应用
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
});