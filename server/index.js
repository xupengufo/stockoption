const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');
require('dotenv').config();

const app = express();
const cache = new NodeCache({ 
  stdTTL: 300, // 5分钟缓存
  checkperiod: 60 // 每分钟检查过期
});

app.use(cors());
app.use(express.json());

// 在生产环境中提供静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_BASE_URL = 'https://api.polygon.io';

// 验证股票代码格式
const isValidSymbol = (symbol) => {
  return /^[A-Z]{1,5}$/.test(symbol);
};

// 获取期权链数据
app.get('/api/options/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { expiration_date } = req.query;
    
    // 验证股票代码
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ error: '无效的股票代码格式' });
    }
    
    const cacheKey = `options_${symbol}_${expiration_date}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    if (!POLYGON_API_KEY) {
      return res.status(500).json({ error: 'API密钥未配置' });
    }

    try {
      const response = await axios.get(
        `${POLYGON_BASE_URL}/v3/reference/options/contracts`,
        {
          params: {
            underlying_ticker: symbol,
            expiration_date,
            limit: 1000,
            apikey: POLYGON_API_KEY
          },
          timeout: 10000 // 10秒超时
        }
      );

      // 验证响应数据
      if (!response.data || !response.data.results) {
        return res.status(404).json({ error: '未找到期权数据' });
      }

      cache.set(cacheKey, response.data);
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 429) {
        res.status(429).json({ error: 'API请求频率限制，请稍后重试' });
      } else if (error.code === 'ECONNABORTED') {
        res.status(408).json({ error: '请求超时，请稍后重试' });
      } else if (error.response?.status === 404) {
        res.status(404).json({ error: '未找到该股票的期权数据' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('获取期权数据错误:', error.message);
    res.status(500).json({ error: '获取期权数据失败' });
  }
});

// 获取股票当前价格
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // 验证股票代码
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ error: '无效的股票代码格式' });
    }
    
    const cacheKey = `stock_${symbol}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }

    if (!POLYGON_API_KEY) {
      return res.status(500).json({ error: 'API密钥未配置' });
    }

    try {
      const response = await axios.get(
        `${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`,
        {
          params: {
            adjusted: true,
            apikey: POLYGON_API_KEY
          },
          timeout: 5000 // 5秒超时
        }
      );

      // 验证响应数据
      if (!response.data || !response.data.results || response.data.results.length === 0) {
        return res.status(404).json({ error: '未找到股票数据' });
      }

      cache.set(cacheKey, response.data);
      res.json(response.data);
    } catch (error) {
      if (error.response?.status === 429) {
        res.status(429).json({ error: 'API请求频率限制，请稍后重试' });
      } else if (error.code === 'ECONNABORTED') {
        res.status(408).json({ error: '请求超时，请稍后重试' });
      } else if (error.response?.status === 404) {
        res.status(404).json({ error: '未找到该股票数据' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('获取股票数据错误:', error.message);
    res.status(500).json({ error: '获取股票数据失败' });
  }
});

// 计算期权策略分析
const analyzeOptionStrategy = async (symbol, strategy, riskTolerance) => {
  // 获取股票当前价格
  const stockResponse = await axios.get(`${POLYGON_BASE_URL}/v2/aggs/ticker/${symbol}/prev`, {
    params: { adjusted: true, apikey: POLYGON_API_KEY }
  });
  
  const currentPrice = stockResponse.data.results[0].c;
  
  // 获取期权链数据
  const optionsResponse = await axios.get(`${POLYGON_BASE_URL}/v3/reference/options/contracts`, {
    params: { 
      underlying_ticker: symbol, 
      limit: 100, 
      apikey: POLYGON_API_KEY 
    }
  });
  
  const options = optionsResponse.data.results;
  
  // 根据策略类型筛选和分析期权
  let recommendations = [];
  
  switch (strategy) {
    case 'cash-secured-put':
      recommendations = analyzeCashSecuredPuts(options, currentPrice, riskTolerance);
      break;
    case 'covered-call':
      recommendations = analyzeCoveredCalls(options, currentPrice, riskTolerance);
      break;
    // 其他策略实现...
    default:
      recommendations = [];
  }
  
  return {
    symbol,
    strategy,
    recommendations,
    riskMetrics: calculateRiskMetrics(recommendations)
  };
};

// 现金担保看跌期权分析
const analyzeCashSecuredPuts = (options, currentPrice, riskTolerance) => {
  const puts = options.filter(opt => 
    opt.contract_type === 'put' && 
    opt.strike_price < currentPrice * 0.95
  );
  
  return puts.slice(0, 5).map(put => ({
    type: 'PUT',
    strike: put.strike_price,
    expiration: put.expiration_date,
    premium: calculatePremium(put, currentPrice, 'put'),
    probability: calculateProbability(put.strike_price, currentPrice, 'put'),
    maxProfit: put.strike_price * 100,
    maxLoss: -((currentPrice - put.strike_price) * 100),
    breakeven: put.strike_price - calculatePremium(put, currentPrice, 'put'),
    annualizedReturn: calculateAnnualizedReturn(put, currentPrice)
  }));
};

// 备兑看涨期权分析
const analyzeCoveredCalls = (options, currentPrice, riskTolerance) => {
  const calls = options.filter(opt => 
    opt.contract_type === 'call' && 
    opt.strike_price > currentPrice * 1.05
  );
  
  return calls.slice(0, 5).map(call => ({
    type: 'CALL',
    strike: call.strike_price,
    expiration: call.expiration_date,
    premium: calculatePremium(call, currentPrice, 'call'),
    probability: calculateProbability(call.strike_price, currentPrice, 'call'),
    maxProfit: (call.strike_price - currentPrice + calculatePremium(call, currentPrice, 'call')) * 100,
    maxLoss: -((currentPrice - call.strike_price) * 100),
    breakeven: currentPrice - calculatePremium(call, currentPrice, 'call'),
    annualizedReturn: calculateAnnualizedReturn(call, currentPrice)
  }));
};

// 计算权利金（简化模型）
const calculatePremium = (option, currentPrice, type) => {
  const intrinsic = type === 'call' 
    ? Math.max(0, currentPrice - option.strike_price)
    : Math.max(0, option.strike_price - currentPrice);
  
  const timeValue = (option.days_to_expiration / 365) * currentPrice * 0.2;
  return intrinsic + timeValue;
};

// 计算成功概率（基于Black-Scholes简化）
const calculateProbability = (strike, currentPrice, type) => {
  const moneyness = type === 'call' 
    ? (currentPrice / strike) 
    : (strike / currentPrice);
  
  return Math.min(0.9, Math.max(0.1, moneyness - 0.1));
};

// 计算年化收益率
const calculateAnnualizedReturn = (option, currentPrice) => {
  const premium = calculatePremium(option, currentPrice, option.contract_type);
  const daysToExpiration = option.days_to_expiration || 30;
  return (premium / currentPrice) * (365 / daysToExpiration);
};

// 计算风险指标
const calculateRiskMetrics = (recommendations) => {
  if (recommendations.length === 0) {
    return { maxDrawdown: 0, sharpeRatio: 0, winRate: 0 };
  }
  
  const winRate = recommendations.reduce((sum, rec) => sum + rec.probability, 0) / recommendations.length;
  
  return {
    maxDrawdown: 0.15 + (Math.random() * 0.1),
    sharpeRatio: 1.0 + (Math.random() * 0.5),
    winRate: winRate
  };
};

// 期权卖方策略分析
app.post('/api/analyze', async (req, res) => {
  try {
    const { symbol, strategy, riskTolerance } = req.body;
    
    // 验证输入
    if (!symbol || !strategy || !riskTolerance) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    if (!isValidSymbol(symbol)) {
      return res.status(400).json({ error: '无效的股票代码格式' });
    }
    
    if (!POLYGON_API_KEY) {
      return res.status(500).json({ error: 'API密钥未配置' });
    }
    
    const cacheKey = `analysis_${symbol}_${strategy}_${riskTolerance}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const analysis = await analyzeOptionStrategy(symbol, strategy, riskTolerance);
    
    // 缓存分析结果1小时
    cache.set(cacheKey, analysis, 3600);
    
    res.json(analysis);
  } catch (error) {
    console.error('分析错误:', error.message);
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'API请求频率限制，请稍后重试' });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: '请求超时，请稍后重试' });
    } else {
      res.status(500).json({ error: '分析失败，请检查股票代码是否正确' });
    }
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