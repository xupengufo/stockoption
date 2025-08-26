/**
 * Yahoo Finance API数据获取模块
 * 作为Polygon.io的替代数据源
 */

const axios = require('axios');

class YahooFinanceAPI {
  constructor() {
    this.baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart';
    this.optionsURL = 'https://query1.finance.yahoo.com/v7/finance/options';
  }

  /**
   * 获取股票当前价格
   */
  async getStockPrice(symbol) {
    try {
      const response = await axios.get(`${this.baseURL}/${symbol}`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const result = response.data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];
      
      return {
        symbol: meta.symbol,
        currentPrice: meta.regularMarketPrice,
        previousClose: meta.previousClose,
        open: quote.open[quote.open.length - 1],
        high: quote.high[quote.high.length - 1],
        low: quote.low[quote.low.length - 1],
        volume: quote.volume[quote.volume.length - 1],
        currency: meta.currency,
        exchange: meta.exchangeName,
        timestamp: new Date(meta.regularMarketTime * 1000)
      };
    } catch (error) {
      throw new Error(`获取股票价格失败: ${error.message}`);
    }
  }

  /**
   * 获取期权链数据
   */
  async getOptionsChain(symbol, expirationDate = null) {
    try {
      const url = expirationDate 
        ? `${this.optionsURL}/${symbol}?date=${Math.floor(new Date(expirationDate).getTime() / 1000)}`
        : `${this.optionsURL}/${symbol}`;
        
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const data = response.data.optionChain.result[0];
      const options = data.options[0];
      
      const calls = options.calls?.map(call => ({
        contractSymbol: call.contractSymbol,
        strike: call.strike,
        currency: call.currency,
        lastPrice: call.lastPrice,
        bid: call.bid,
        ask: call.ask,
        volume: call.volume,
        openInterest: call.openInterest,
        impliedVolatility: call.impliedVolatility,
        expiration: new Date(call.expiration * 1000),
        inTheMoney: call.inTheMoney,
        contractType: 'CALL',
        lastTradeDate: new Date(call.lastTradeDate * 1000)
      })) || [];

      const puts = options.puts?.map(put => ({
        contractSymbol: put.contractSymbol,
        strike: put.strike,
        currency: put.currency,
        lastPrice: put.lastPrice,
        bid: put.bid,
        ask: put.ask,
        volume: put.volume,
        openInterest: put.openInterest,
        impliedVolatility: put.impliedVolatility,
        expiration: new Date(put.expiration * 1000),
        inTheMoney: put.inTheMoney,
        contractType: 'PUT',
        lastTradeDate: new Date(put.lastTradeDate * 1000)
      })) || [];

      return {
        symbol: data.underlyingSymbol,
        expirationDates: data.expirationDates.map(date => new Date(date * 1000)),
        calls,
        puts,
        quote: data.quote
      };
    } catch (error) {
      throw new Error(`获取期权链失败: ${error.message}`);
    }
  }

  /**
   * 根据期权数据计算权利金
   */
  calculatePremium(option, currentPrice) {
    // 如果有实际的买卖价，使用中间价
    if (option.bid && option.ask && option.bid > 0 && option.ask > 0) {
      return (option.bid + option.ask) / 2;
    }
    
    // 如果有最后交易价格
    if (option.lastPrice && option.lastPrice > 0) {
      return option.lastPrice;
    }
    
    // 回退到理论计算
    return this.calculateTheoreticalPremium(option, currentPrice);
  }

  /**
   * 理论权利金计算（简化的Black-Scholes）
   */
  calculateTheoreticalPremium(option, currentPrice) {
    const strike = option.strike;
    const timeToExpiry = this.getTimeToExpiry(option.expiration);
    const riskFreeRate = 0.05; // 5% 无风险利率
    const volatility = option.impliedVolatility || 0.25; // 默认25%波动率
    
    // 内在价值
    const intrinsicValue = option.contractType === 'CALL'
      ? Math.max(0, currentPrice - strike)
      : Math.max(0, strike - currentPrice);
    
    // 时间价值（简化计算）
    const timeValue = timeToExpiry > 0 
      ? (volatility * Math.sqrt(timeToExpiry) * currentPrice * 0.4)
      : 0;
    
    return Math.max(0.01, intrinsicValue + timeValue); // 最小0.01
  }

  /**
   * 计算到期时间（年为单位）
   */
  getTimeToExpiry(expirationDate) {
    const now = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return Math.max(0, diffDays / 365);
  }

  /**
   * 筛选期权合约
   */
  filterOptions(options, currentPrice, strategy, riskTolerance) {
    let filtered = [];
    
    switch (strategy) {
      case 'cash-secured-put':
        filtered = options.puts.filter(put => 
          put.strike < currentPrice * 0.98 && // 轻微价外
          put.strike > currentPrice * 0.85 && // 不要太价外
          this.getTimeToExpiry(put.expiration) > 0.02 && // 至少7天
          this.getTimeToExpiry(put.expiration) < 0.25 // 不超过3个月
        );
        break;
        
      case 'covered-call':
        filtered = options.calls.filter(call => 
          call.strike > currentPrice * 1.02 && // 轻微价外
          call.strike < currentPrice * 1.15 && // 不要太价外
          this.getTimeToExpiry(call.expiration) > 0.02 &&
          this.getTimeToExpiry(call.expiration) < 0.25
        );
        break;
        
      default:
        filtered = [...options.calls, ...options.puts];
    }
    
    // 按成交量和未平仓合约排序
    return filtered
      .filter(option => option.volume > 0 || option.openInterest > 0)
      .sort((a, b) => (b.volume + b.openInterest) - (a.volume + a.openInterest))
      .slice(0, 10);
  }
}

module.exports = YahooFinanceAPI;