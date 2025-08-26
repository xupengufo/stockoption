/**
 * 富途OpenAPI集成模块
 * 获取真实的期权数据
 */

const axios = require('axios');

class FutuOpenAPI {
  constructor(config = {}) {
    this.config = {
      // 富途OpenAPI配置
      host: config.host || 'localhost',
      port: config.port || 11111,
      apiKey: config.apiKey || process.env.FUTU_API_KEY,
      // API endpoints
      baseURL: `http://${config.host || 'localhost'}:${config.port || 11111}`,
      timeout: config.timeout || 10000
    };
    
    this.isConnected = false;
  }

  /**
   * 初始化连接
   */
  async initialize() {
    try {
      // 检查富途OpenAPI连接状态
      const response = await axios.get(`${this.config.baseURL}/api/system/status`, {
        timeout: this.config.timeout
      });
      
      this.isConnected = response.status === 200;
      console.log('富途OpenAPI连接成功');
      return true;
    } catch (error) {
      console.log('富途OpenAPI连接失败:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 获取股票基本信息
   */
  async getStockInfo(symbol) {
    if (!this.isConnected) {
      throw new Error('富途OpenAPI未连接');
    }

    try {
      const response = await axios.post(`${this.config.baseURL}/api/quote/stockInfo`, {
        symbol: symbol,
        market: this.getMarketBySymbol(symbol)
      }, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        symbol: data.symbol,
        name: data.name,
        currentPrice: data.currentPrice,
        previousClose: data.previousClose,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
        turnover: data.turnover,
        currency: data.currency,
        market: data.market,
        timestamp: new Date(),
        dataSource: 'Futu OpenAPI'
      };
    } catch (error) {
      throw new Error(`获取股票信息失败: ${error.message}`);
    }
  }

  /**
   * 获取期权链数据
   */
  async getOptionChain(symbol, expirationDate = null) {
    if (!this.isConnected) {
      throw new Error('富途OpenAPI未连接');
    }

    try {
      const params = {
        symbol: symbol,
        market: this.getMarketBySymbol(symbol)
      };
      
      if (expirationDate) {
        params.expirationDate = expirationDate;
      }

      const response = await axios.post(`${this.config.baseURL}/api/quote/optionChain`, params, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        symbol: data.symbol,
        expirationDates: data.expirationDates,
        calls: data.calls?.map(this.formatOptionData) || [],
        puts: data.puts?.map(this.formatOptionData) || [],
        underlyingPrice: data.underlyingPrice,
        timestamp: new Date(),
        dataSource: 'Futu OpenAPI'
      };
    } catch (error) {
      throw new Error(`获取期权链失败: ${error.message}`);
    }
  }

  /**
   * 获取期权实时报价
   */
  async getOptionQuote(optionSymbol) {
    if (!this.isConnected) {
      throw new Error('富途OpenAPI未连接');
    }

    try {
      const response = await axios.post(`${this.config.baseURL}/api/quote/optionQuote`, {
        optionSymbol: optionSymbol
      }, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      return {
        symbol: data.symbol,
        bid: data.bid,
        ask: data.ask,
        lastPrice: data.lastPrice,
        volume: data.volume,
        openInterest: data.openInterest,
        impliedVolatility: data.impliedVolatility,
        delta: data.delta,
        gamma: data.gamma,
        theta: data.theta,
        vega: data.vega,
        rho: data.rho,
        timestamp: new Date(),
        dataSource: 'Futu OpenAPI'
      };
    } catch (error) {
      throw new Error(`获取期权报价失败: ${error.message}`);
    }
  }

  /**
   * 批量获取期权报价
   */
  async getBatchOptionQuotes(optionSymbols) {
    if (!this.isConnected) {
      throw new Error('富途OpenAPI未连接');
    }

    try {
      const response = await axios.post(`${this.config.baseURL}/api/quote/batchOptionQuote`, {
        optionSymbols: optionSymbols
      }, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.map(this.formatOptionQuote);
    } catch (error) {
      throw new Error(`批量获取期权报价失败: ${error.message}`);
    }
  }

  /**
   * 获取期权历史数据
   */
  async getOptionHistory(optionSymbol, period = '1D', count = 100) {
    if (!this.isConnected) {
      throw new Error('富途OpenAPI未连接');
    }

    try {
      const response = await axios.post(`${this.config.baseURL}/api/quote/optionHistory`, {
        optionSymbol: optionSymbol,
        period: period,
        count: count
      }, {
        timeout: this.config.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.map(item => ({
        timestamp: new Date(item.timestamp),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        turnover: item.turnover
      }));
    } catch (error) {
      throw new Error(`获取期权历史数据失败: ${error.message}`);
    }
  }

  /**
   * 格式化期权数据
   */
  formatOptionData(option) {
    return {
      contractSymbol: option.contractSymbol,
      optionType: option.optionType, // 'CALL' or 'PUT'
      strike: option.strike,
      expirationDate: option.expirationDate,
      bid: option.bid,
      ask: option.ask,
      lastPrice: option.lastPrice,
      change: option.change,
      changePercent: option.changePercent,
      volume: option.volume,
      openInterest: option.openInterest,
      impliedVolatility: option.impliedVolatility,
      // Greeks
      delta: option.delta,
      gamma: option.gamma,
      theta: option.theta,
      vega: option.vega,
      rho: option.rho,
      // 计算属性
      premium: option.lastPrice || ((option.bid + option.ask) / 2),
      inTheMoney: option.inTheMoney,
      timeValue: option.timeValue,
      intrinsicValue: option.intrinsicValue
    };
  }

  /**
   * 格式化期权报价
   */
  formatOptionQuote(quote) {
    return {
      symbol: quote.symbol,
      bid: quote.bid,
      ask: quote.ask,
      lastPrice: quote.lastPrice,
      premium: quote.lastPrice || ((quote.bid + quote.ask) / 2),
      volume: quote.volume,
      openInterest: quote.openInterest,
      impliedVolatility: quote.impliedVolatility,
      delta: quote.delta,
      gamma: quote.gamma,
      theta: quote.theta,
      vega: quote.vega,
      rho: quote.rho,
      timestamp: new Date()
    };
  }

  /**
   * 根据股票代码确定市场
   */
  getMarketBySymbol(symbol) {
    // 美股
    if (/^[A-Z]{1,5}$/.test(symbol)) {
      return 'US';
    }
    // 港股
    if (/^\d{5}$/.test(symbol)) {
      return 'HK';
    }
    // A股
    if (/^(00|30|60)\d{4}$/.test(symbol)) {
      return 'SH_SZ';
    }
    
    return 'US'; // 默认美股
  }

  /**
   * 筛选期权合约
   */
  filterOptionsForStrategy(options, currentPrice, strategy, riskTolerance) {
    let filtered = [];
    
    switch (strategy) {
      case 'cash-secured-put':
        filtered = options.puts.filter(put => 
          put.strike < currentPrice * 0.98 && 
          put.strike > currentPrice * 0.85 &&
          put.volume > 10 && // 确保有一定流动性
          put.openInterest > 100
        );
        break;
        
      case 'covered-call':
        filtered = options.calls.filter(call => 
          call.strike > currentPrice * 1.02 && 
          call.strike < currentPrice * 1.15 &&
          call.volume > 10 &&
          call.openInterest > 100
        );
        break;
        
      default:
        filtered = [...options.calls, ...options.puts];
    }
    
    // 按成交量和未平仓合约排序
    return filtered
      .sort((a, b) => (b.volume + b.openInterest) - (a.volume + a.openInterest))
      .slice(0, 10);
  }

  /**
   * 检查API可用性
   */
  async checkAvailability() {
    try {
      await this.initialize();
      return this.isConnected;
    } catch (error) {
      return false;
    }
  }
}

module.exports = FutuOpenAPI;