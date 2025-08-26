/**
 * Polygon.io API 数据源管理器
 * 获取真实的股票和期权数据
 */

const axios = require('axios');

class PolygonDataSourceManager {
  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY;
    this.baseURL = 'https://api.polygon.io';
    this.cache = new Map();
    this.cacheTime = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 检查API密钥是否可用
   */
  isAvailable() {
    return this.apiKey && this.apiKey !== 'your_polygon_api_key_here';
  }

  /**
   * 获取股票价格数据
   */
  async getStockPrice(symbol) {
    if (!this.isAvailable()) {
      throw new Error('Polygon.io API密钥未配置');
    }

    const cacheKey = `stock_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 获取前一日聚合数据
      const response = await axios.get(`${this.baseURL}/v2/aggs/ticker/${symbol}/prev`, {
        params: {
          adjusted: true,
          apikey: this.apiKey
        },
        timeout: 10000
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error(`未找到${symbol}的股票数据`);
      }

      const result = response.data.results[0];
      
      const stockData = {
        symbol: symbol.toUpperCase(),
        currentPrice: result.c,
        previousClose: result.c,
        open: result.o,
        high: result.h,
        low: result.l,
        volume: result.v,
        timestamp: new Date(result.t),
        change: 0, // 需要实时数据计算
        changePercent: 0,
        currency: 'USD',
        exchange: 'NASDAQ/NYSE',
        dataSource: 'Polygon.io'
      };

      this.setCache(cacheKey, stockData);
      return stockData;
    } catch (error) {
      throw new Error(`Polygon.io获取股票数据失败: ${error.message}`);
    }
  }

  /**
   * 获取期权链数据
   */
  async getOptionChain(symbol) {
    if (!this.isAvailable()) {
      throw new Error('Polygon.io API密钥未配置');
    }

    const cacheKey = `options_${symbol}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // 获取期权合约列表
      const response = await axios.get(`${this.baseURL}/v3/reference/options/contracts`, {
        params: {
          underlying_ticker: symbol,
          limit: 1000,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (!response.data.results) {
        throw new Error(`未找到${symbol}的期权数据`);
      }

      const contracts = response.data.results;
      
      // 按类型分组期权
      const calls = [];
      const puts = [];
      
      for (const contract of contracts) {
        const optionData = {
          contractSymbol: contract.ticker,
          optionType: contract.contract_type,
          strike: contract.strike_price,
          expirationDate: contract.expiration_date,
          underlyingTicker: contract.underlying_ticker,
          // 需要额外调用获取报价数据
          bid: 0,
          ask: 0,
          lastPrice: 0,
          volume: 0,
          openInterest: 0,
          impliedVolatility: 0.25, // 默认值
          dataSource: 'Polygon.io'
        };

        if (contract.contract_type === 'call') {
          calls.push(optionData);
        } else {
          puts.push(optionData);
        }
      }

      const chainData = {
        symbol: symbol.toUpperCase(),
        calls,
        puts,
        timestamp: new Date(),
        dataSource: 'Polygon.io'
      };

      this.setCache(cacheKey, chainData);
      return chainData;
    } catch (error) {
      throw new Error(`Polygon.io获取期权链失败: ${error.message}`);
    }
  }

  /**
   * 获取期权实时报价
   */
  async getOptionQuote(optionSymbol) {
    if (!this.isAvailable()) {
      throw new Error('Polygon.io API密钥未配置');
    }

    try {
      // 获取期权最新交易数据
      const response = await axios.get(`${this.baseURL}/v2/last/trade/O:${optionSymbol}`, {
        params: {
          apikey: this.apiKey
        },
        timeout: 10000
      });

      if (!response.data.results) {
        // 如果没有交易数据，返回基础结构
        return {
          symbol: optionSymbol,
          bid: 0,
          ask: 0,
          lastPrice: 0,
          volume: 0,
          timestamp: new Date(),
          dataSource: 'Polygon.io (No Data)'
        };
      }

      const result = response.data.results;
      
      return {
        symbol: optionSymbol,
        bid: result.p || 0,
        ask: result.p || 0,
        lastPrice: result.p || 0,
        volume: result.s || 0,
        timestamp: new Date(result.t),
        dataSource: 'Polygon.io'
      };
    } catch (error) {
      console.log(`获取期权报价失败: ${error.message}`);
      return {
        symbol: optionSymbol,
        bid: 0,
        ask: 0,
        lastPrice: 0,
        volume: 0,
        timestamp: new Date(),
        dataSource: 'Polygon.io (Error)'
      };
    }
  }

  /**
   * 获取期权数据用于策略分析
   */
  async getOptionsForStrategy(symbol, strategy, riskTolerance) {
    const stockData = await this.getStockPrice(symbol);
    const optionChain = await this.getOptionChain(symbol);
    
    const currentPrice = stockData.currentPrice;
    const recommendations = [];

    // 根据策略筛选期权
    let targetOptions = [];
    
    if (strategy === 'cash-secured-put') {
      // 筛选价外看跌期权
      targetOptions = optionChain.puts.filter(put => 
        put.strike < currentPrice * 0.98 && 
        put.strike > currentPrice * 0.85 &&
        this.isValidExpiration(put.expirationDate)
      ).slice(0, 10);
    } else if (strategy === 'covered-call') {
      // 筛选价外看涨期权
      targetOptions = optionChain.calls.filter(call => 
        call.strike > currentPrice * 1.02 && 
        call.strike < currentPrice * 1.15 &&
        this.isValidExpiration(call.expirationDate)
      ).slice(0, 10);
    }

    // 为每个期权计算详细数据
    for (const option of targetOptions) {
      try {
        const quote = await this.getOptionQuote(option.contractSymbol);
        const timeToExpiry = this.getTimeToExpiry(option.expirationDate);
        const premium = quote.lastPrice || this.calculateTheoreticalPremium(option, currentPrice, timeToExpiry);
        
        recommendations.push({
          type: option.optionType.toUpperCase(),
          contractSymbol: option.contractSymbol,
          strike: option.strike,
          expiration: option.expirationDate,
          premium: parseFloat(premium.toFixed(2)),
          bid: quote.bid,
          ask: quote.ask,
          lastPrice: quote.lastPrice,
          volume: quote.volume,
          openInterest: 0, // Polygon.io基础版本可能不提供
          impliedVolatility: option.impliedVolatility,
          probability: this.calculateSuccessProbability(option.strike, currentPrice, option.optionType),
          maxProfit: this.calculateMaxProfit(option, premium, currentPrice, strategy),
          maxLoss: this.calculateMaxLoss(option, premium, currentPrice, strategy),
          breakeven: this.calculateBreakeven(option, premium, strategy),
          annualizedReturn: this.calculateAnnualizedReturn(premium, option.strike, timeToExpiry),
          dataSource: 'Polygon.io'
        });
      } catch (error) {
        console.log(`处理期权${option.contractSymbol}时出错:`, error.message);
      }
    }

    return recommendations;
  }

  /**
   * 验证到期日是否有效（1-90天内）
   */
  isValidExpiration(expirationDate) {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const daysToExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysToExpiry >= 1 && daysToExpiry <= 90;
  }

  /**
   * 计算到期时间（年为单位）
   */
  getTimeToExpiry(expirationDate) {
    const expiry = new Date(expirationDate);
    const now = new Date();
    const daysToExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
    return Math.max(0.001, daysToExpiry / 365);
  }

  /**
   * 计算理论权利金（Black-Scholes简化版）
   */
  calculateTheoreticalPremium(option, stockPrice, timeToExpiry) {
    const strike = option.strike;
    const volatility = 0.25; // 假设25%年化波动率
    const riskFreeRate = 0.05; // 假设5%无风险利率
    
    // 简化的Black-Scholes计算
    const d1 = (Math.log(stockPrice / strike) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
    
    const normCDF = (x) => {
      return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    };
    
    if (option.optionType === 'call') {
      return stockPrice * normCDF(d1) - strike * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(d2);
    } else {
      return strike * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(-d2) - stockPrice * normCDF(-d1);
    }
  }

  /**
   * 误差函数近似
   */
  erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  /**
   * 计算成功概率
   */
  calculateSuccessProbability(strike, currentPrice, optionType) {
    const moneyness = optionType === 'call' ? currentPrice / strike : strike / currentPrice;
    
    if (moneyness > 1.05) return 0.85;
    if (moneyness > 1.02) return 0.75;
    if (moneyness > 0.98) return 0.65;
    if (moneyness > 0.95) return 0.55;
    return 0.45;
  }

  /**
   * 计算最大盈利
   */
  calculateMaxProfit(option, premium, currentPrice, strategy) {
    if (strategy === 'cash-secured-put') {
      return premium * 100;
    } else if (strategy === 'covered-call') {
      return (option.strike - currentPrice + premium) * 100;
    }
    return 0;
  }

  /**
   * 计算最大损失
   */
  calculateMaxLoss(option, premium, currentPrice, strategy) {
    if (strategy === 'cash-secured-put') {
      return Math.max(0, (option.strike - premium) * 100);
    } else if (strategy === 'covered-call') {
      return currentPrice * 100;
    }
    return 0;
  }

  /**
   * 计算盈亏平衡点
   */
  calculateBreakeven(option, premium, strategy) {
    if (strategy === 'cash-secured-put') {
      return option.strike - premium;
    } else if (strategy === 'covered-call') {
      return option.strike + premium;
    }
    return 0;
  }

  /**
   * 计算年化收益率
   */
  calculateAnnualizedReturn(premium, strike, timeToExpiry) {
    if (timeToExpiry <= 0) return 0;
    return (premium / strike) * (365 / (timeToExpiry * 365));
  }

  /**
   * 缓存管理
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

module.exports = PolygonDataSourceManager;