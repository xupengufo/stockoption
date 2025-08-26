/**
 * 数据源管理器
 * 整合多种数据源，提供统一的数据获取接口
 */

const axios = require('axios');

class DataSourceManager {
  constructor() {
    this.sources = {
      yahoo: {
        name: 'Yahoo Finance',
        stockURL: 'https://query1.finance.yahoo.com/v8/finance/chart',
        optionsURL: 'https://query1.finance.yahoo.com/v7/finance/options',
        priority: 1
      },
      alphavantage: {
        name: 'Alpha Vantage',
        baseURL: 'https://www.alphavantage.co/query',
        priority: 2
      },
      mock: {
        name: 'Enhanced Simulation',
        priority: 999
      }
    };
  }

  /**
   * 获取股票价格（多数据源回退）
   */
  async getStockPrice(symbol) {
    // 1. 尝试Yahoo Finance
    try {
      return await this.getYahooStockPrice(symbol);
    } catch (error) {
      console.log('Yahoo Finance股票数据获取失败:', error.message);
    }

    // 2. 回退到模拟数据
    return this.generateMockStockPrice(symbol);
  }

  /**
   * 获取期权数据（多数据源回退）
   */
  async getOptionsData(symbol, strategy, riskTolerance) {
    const stockPrice = await this.getStockPrice(symbol);
    
    // 1. 尝试Yahoo Finance期权数据
    try {
      const options = await this.getYahooOptionsChain(symbol);
      return this.processRealOptionsData(options, stockPrice, strategy, riskTolerance);
    } catch (error) {
      console.log('Yahoo Finance期权数据获取失败:', error.message);
    }

    // 2. 使用增强的模拟数据
    return this.generateEnhancedOptionsData(symbol, stockPrice, strategy, riskTolerance);
  }

  /**
   * Yahoo Finance股票价格
   */
  async getYahooStockPrice(symbol) {
    const response = await axios.get(`${this.sources.yahoo.stockURL}/${symbol}`, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OptionsAnalyzer/1.0)'
      }
    });

    const result = response.data.chart.result[0];
    const meta = result.meta;
    
    return {
      symbol: meta.symbol,
      currentPrice: meta.regularMarketPrice,
      previousClose: meta.previousClose,
      currency: meta.currency,
      exchange: meta.exchangeName,
      timestamp: new Date(meta.regularMarketTime * 1000),
      dataSource: 'Yahoo Finance'
    };
  }

  /**
   * Yahoo Finance期权链（简化版本，处理401错误）
   */
  async getYahooOptionsChain(symbol) {
    try {
      const response = await axios.get(`${this.sources.yahoo.optionsURL}/${symbol}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OptionsAnalyzer/1.0)',
          'Referer': 'https://finance.yahoo.com/',
          'Accept': 'application/json'
        }
      });

      const data = response.data.optionChain.result[0];
      return data.options[0];
    } catch (error) {
      // Yahoo期权API经常有访问限制，这是正常的
      throw new Error(`Yahoo期权数据访问受限: ${error.response?.status || error.message}`);
    }
  }

  /**
   * 处理真实期权数据
   */
  processRealOptionsData(options, stockPrice, strategy, riskTolerance) {
    const calls = options.calls || [];
    const puts = options.puts || [];
    
    let filteredOptions = [];
    
    if (strategy === 'cash-secured-put') {
      filteredOptions = puts.filter(put => 
        put.strike < stockPrice.currentPrice * 0.98 &&
        put.strike > stockPrice.currentPrice * 0.85 &&
        put.volume > 0
      );
    } else if (strategy === 'covered-call') {
      filteredOptions = calls.filter(call => 
        call.strike > stockPrice.currentPrice * 1.02 &&
        call.strike < stockPrice.currentPrice * 1.15 &&
        call.volume > 0
      );
    }
    
    return filteredOptions.slice(0, 10).map(option => ({
      type: strategy === 'cash-secured-put' ? 'PUT' : 'CALL',
      strike: option.strike,
      expiration: new Date(option.expiration * 1000).toISOString().split('T')[0],
      premium: this.calculateRealPremium(option),
      bid: option.bid || 0,
      ask: option.ask || 0,
      volume: option.volume || 0,
      openInterest: option.openInterest || 0,
      impliedVolatility: option.impliedVolatility || 0,
      dataSource: 'Yahoo Finance'
    }));
  }

  /**
   * 计算真实权利金
   */
  calculateRealPremium(option) {
    if (option.bid && option.ask && option.bid > 0 && option.ask > 0) {
      return (option.bid + option.ask) / 2;
    }
    if (option.lastPrice && option.lastPrice > 0) {
      return option.lastPrice;
    }
    return Math.max(0.01, Math.random() * 5 + 0.5); // 回退值
  }

  /**
   * 生成模拟股票价格
   */
  generateMockStockPrice(symbol) {
    const basePrices = {
      'AAPL': 227.16,
      'MSFT': 421.33,
      'GOOGL': 166.85,
      'AMZN': 186.40,
      'TSLA': 218.80,
      'NVDA': 128.45,
      'META': 512.20
    };
    
    const basePrice = basePrices[symbol] || 150.00;
    const currentPrice = basePrice * (0.98 + Math.random() * 0.04); // ±2%波动
    
    return {
      symbol,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      previousClose: parseFloat((currentPrice * (0.995 + Math.random() * 0.01)).toFixed(2)),
      currency: 'USD',
      exchange: 'NASDAQ',
      timestamp: new Date(),
      dataSource: 'Enhanced Simulation'
    };
  }

  /**
   * 生成增强的期权数据
   */
  generateEnhancedOptionsData(symbol, stockPrice, strategy, riskTolerance) {
    const currentPrice = stockPrice.currentPrice;
    const recommendations = [];
    
    if (strategy === 'cash-secured-put') {
      const strikes = [0.97, 0.95, 0.92, 0.90, 0.88].map(ratio => 
        Math.round(currentPrice * ratio)
      );
      
      strikes.forEach((strike, index) => {
        const days = 30 + index * 7;
        const timeToExpiry = days / 365;
        const volatility = 0.20 + Math.random() * 0.15;
        const premium = this.calculateBlackScholesPremium(
          'PUT', currentPrice, strike, timeToExpiry, volatility, 0.05
        );
        
        recommendations.push({
          type: 'PUT',
          strike,
          expiration: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          premium: parseFloat(premium.toFixed(2)),
          bid: parseFloat((premium * 0.95).toFixed(2)),
          ask: parseFloat((premium * 1.05).toFixed(2)),
          volume: Math.floor(Math.random() * 1000) + 100,
          openInterest: Math.floor(Math.random() * 5000) + 500,
          impliedVolatility: parseFloat(volatility.toFixed(4)),
          probability: this.calculateSuccessProbability(strike, currentPrice, 'PUT'),
          maxProfit: parseFloat((premium * 100).toFixed(2)),
          maxLoss: parseFloat(((currentPrice - strike) * 100).toFixed(2)),
          breakeven: parseFloat((strike - premium).toFixed(2)),
          annualizedReturn: parseFloat(((premium / strike) * (365 / days)).toFixed(4)),
          dataSource: 'Black-Scholes Model'
        });
      });
    } else if (strategy === 'covered-call') {
      const strikes = [1.03, 1.05, 1.08, 1.10, 1.12].map(ratio => 
        Math.round(currentPrice * ratio)
      );
      
      strikes.forEach((strike, index) => {
        const days = 30 + index * 7;
        const timeToExpiry = days / 365;
        const volatility = 0.18 + Math.random() * 0.12;
        const premium = this.calculateBlackScholesPremium(
          'CALL', currentPrice, strike, timeToExpiry, volatility, 0.05
        );
        
        recommendations.push({
          type: 'CALL',
          strike,
          expiration: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          premium: parseFloat(premium.toFixed(2)),
          bid: parseFloat((premium * 0.95).toFixed(2)),
          ask: parseFloat((premium * 1.05).toFixed(2)),
          volume: Math.floor(Math.random() * 800) + 50,
          openInterest: Math.floor(Math.random() * 3000) + 200,
          impliedVolatility: parseFloat(volatility.toFixed(4)),
          probability: this.calculateSuccessProbability(strike, currentPrice, 'CALL'),
          maxProfit: parseFloat(((strike - currentPrice + premium) * 100).toFixed(2)),
          maxLoss: parseFloat((currentPrice * 100).toFixed(2)),
          breakeven: parseFloat((currentPrice - premium).toFixed(2)),
          annualizedReturn: parseFloat(((premium / currentPrice) * (365 / days)).toFixed(4)),
          dataSource: 'Black-Scholes Model'
        });
      });
    }
    
    return recommendations;
  }

  /**
   * Black-Scholes期权定价模型
   */
  calculateBlackScholesPremium(type, stockPrice, strikePrice, timeToExpiry, volatility, riskFreeRate) {
    if (timeToExpiry <= 0) return 0;
    
    const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate + 0.5 * volatility * volatility) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
    
    const normCDF = (x) => {
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x) / Math.sqrt(2);
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;
      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return 0.5 * (1.0 + sign * y);
    };
    
    if (type === 'CALL') {
      return stockPrice * normCDF(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(d2);
    } else {
      return strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(-d2) - stockPrice * normCDF(-d1);
    }
  }

  /**
   * 计算成功概率
   */
  calculateSuccessProbability(strike, currentPrice, type) {
    const moneyness = type === 'CALL' ? currentPrice / strike : strike / currentPrice;
    return Math.min(0.90, Math.max(0.50, moneyness - 0.05 + Math.random() * 0.1));
  }
}

module.exports = DataSourceManager;