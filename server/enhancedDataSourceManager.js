/**
 * 增强数据源管理器
 * 集成富途OpenAPI + Yahoo Finance + 智能模拟
 */

const FutuOpenAPI = require('./futuOpenAPI');
const UniversalDataSourceManager = require('./universalDataSourceManager');

class EnhancedDataSourceManager {
  constructor(config = {}) {
    this.futuAPI = new FutuOpenAPI(config.futu);
    this.universalManager = new UniversalDataSourceManager();
    this.dataSourcePriority = ['futu', 'yahoo', 'simulation'];
    this.isInitialized = false;
  }

  /**
   * 初始化所有数据源
   */
  async initialize() {
    console.log('🚀 初始化增强数据源管理器...');
    
    // 检查富途API可用性
    const futuAvailable = await this.futuAPI.checkAvailability();
    
    if (futuAvailable) {
      console.log('✅ 富途OpenAPI连接成功');
      this.dataSourcePriority = ['futu', 'yahoo', 'simulation'];
    } else {
      console.log('⚠️ 富途OpenAPI不可用，使用Yahoo Finance + 智能模拟');
      this.dataSourcePriority = ['yahoo', 'simulation'];
    }
    
    this.isInitialized = true;
  }

  /**
   * 获取股票价格（多数据源）
   */
  async getStockPrice(symbol) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    for (const source of this.dataSourcePriority) {
      try {
        switch (source) {
          case 'futu':
            return await this.getFutuStockPrice(symbol);
          case 'yahoo':
            return await this.universalManager.getStockPrice(symbol);
          case 'simulation':
            return this.universalManager.generateSmartStockPrice(symbol);
        }
      } catch (error) {
        console.log(`数据源 ${source} 获取股票价格失败:`, error.message);
        continue;
      }
    }
    
    throw new Error('所有数据源均不可用');
  }

  /**
   * 获取期权数据（多数据源）
   */
  async getOptionsData(symbol, strategy, riskTolerance) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const stockPrice = await this.getStockPrice(symbol);
    
    for (const source of this.dataSourcePriority) {
      try {
        switch (source) {
          case 'futu':
            return await this.getFutuOptionsData(symbol, stockPrice, strategy, riskTolerance);
          case 'yahoo':
          case 'simulation':
            return await this.universalManager.getOptionsData(symbol, strategy, riskTolerance);
        }
      } catch (error) {
        console.log(`数据源 ${source} 获取期权数据失败:`, error.message);
        continue;
      }
    }
    
    // 最后回退到通用数据源
    return await this.universalManager.getOptionsData(symbol, strategy, riskTolerance);
  }

  /**
   * 从富途API获取股票价格
   */
  async getFutuStockPrice(symbol) {
    const stockInfo = await this.futuAPI.getStockInfo(symbol);
    
    return {
      symbol: stockInfo.symbol,
      name: stockInfo.name,
      currentPrice: stockInfo.currentPrice,
      previousClose: stockInfo.previousClose,
      change: stockInfo.change,
      changePercent: stockInfo.changePercent,
      volume: stockInfo.volume,
      currency: stockInfo.currency,
      exchange: stockInfo.market,
      timestamp: stockInfo.timestamp,
      dataSource: 'Futu OpenAPI'
    };
  }

  /**
   * 从富途API获取期权数据
   */
  async getFutuOptionsData(symbol, stockPrice, strategy, riskTolerance) {
    const optionChain = await this.futuAPI.getOptionChain(symbol);
    const currentPrice = stockPrice.currentPrice;
    
    // 筛选适合的期权合约
    const filteredOptions = this.futuAPI.filterOptionsForStrategy(
      optionChain, 
      currentPrice, 
      strategy, 
      riskTolerance
    );
    
    // 获取详细报价信息
    const optionSymbols = filteredOptions.map(option => option.contractSymbol);
    const detailedQuotes = await this.futuAPI.getBatchOptionQuotes(optionSymbols);
    
    // 合并数据并生成推荐
    const recommendations = filteredOptions.map((option, index) => {
      const quote = detailedQuotes[index] || {};
      const premium = quote.premium || option.premium || option.lastPrice;
      
      return {
        type: option.optionType,
        contractSymbol: option.contractSymbol,
        strike: option.strike,
        expiration: option.expirationDate,
        premium: parseFloat(premium.toFixed(2)),
        bid: quote.bid || option.bid,
        ask: quote.ask || option.ask,
        lastPrice: quote.lastPrice || option.lastPrice,
        volume: option.volume,
        openInterest: option.openInterest,
        impliedVolatility: option.impliedVolatility,
        // Greeks数据
        delta: option.delta,
        gamma: option.gamma,
        theta: option.theta,
        vega: option.vega,
        rho: option.rho,
        // 计算字段
        probability: this.calculateSuccessProbability(option.strike, currentPrice, option.optionType),
        maxProfit: this.calculateMaxProfit(option, premium, currentPrice, strategy),
        maxLoss: this.calculateMaxLoss(option, premium, currentPrice, strategy),
        breakeven: this.calculateBreakeven(option, premium, strategy),
        annualizedReturn: this.calculateAnnualizedReturn(option, premium, currentPrice),
        intrinsicValue: option.intrinsicValue,
        timeValue: option.timeValue,
        dataSource: 'Futu OpenAPI (Real Data)'
      };
    });
    
    return recommendations;
  }

  /**
   * 计算成功概率
   */
  calculateSuccessProbability(strike, currentPrice, optionType) {
    const moneyness = optionType === 'CALL' ? currentPrice / strike : strike / currentPrice;
    
    let baseProbability;
    if (moneyness > 1.05) {
      baseProbability = 0.30;
    } else if (moneyness > 1.02) {
      baseProbability = 0.50;
    } else if (moneyness > 0.98) {
      baseProbability = 0.65;
    } else if (moneyness > 0.95) {
      baseProbability = 0.75;
    } else {
      baseProbability = 0.85;
    }
    
    return Math.max(0.20, Math.min(0.95, baseProbability + (Math.random() - 0.5) * 0.1));
  }

  /**
   * 计算最大盈利
   */
  calculateMaxProfit(option, premium, currentPrice, strategy) {
    if (strategy === 'cash-secured-put') {
      return premium * 100; // 权利金收入
    } else if (strategy === 'covered-call') {
      return (option.strike - currentPrice + premium) * 100;
    }
    return premium * 100;
  }

  /**
   * 计算最大亏损
   */
  calculateMaxLoss(option, premium, currentPrice, strategy) {
    if (strategy === 'cash-secured-put') {
      return Math.max(0, (option.strike - premium) * 100);
    } else if (strategy === 'covered-call') {
      return currentPrice * 100;
    }
    return premium * 100;
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
    return option.strike;
  }

  /**
   * 计算年化收益率
   */
  calculateAnnualizedReturn(option, premium, currentPrice) {
    const expirationDate = new Date(option.expirationDate);
    const now = new Date();
    const daysToExpiry = Math.max(1, (expirationDate - now) / (1000 * 60 * 60 * 24));
    
    return (premium / currentPrice) * (365 / daysToExpiry);
  }

  /**
   * 获取数据源状态
   */
  getDataSourceStatus() {
    return {
      futuAPI: this.futuAPI.isConnected,
      universalManager: true,
      priority: this.dataSourcePriority,
      initialized: this.isInitialized
    };
  }

  /**
   * 获取支持的功能
   */
  getSupportedFeatures() {
    const features = {
      realTimeQuotes: this.futuAPI.isConnected,
      historicalData: this.futuAPI.isConnected,
      greeksData: this.futuAPI.isConnected,
      optionChains: true,
      universalStockSupport: true,
      multiMarketSupport: this.futuAPI.isConnected, // 美股、港股、A股
      dataSourceFallback: true
    };
    
    return features;
  }

  /**
   * 获取实时Greeks数据（仅富途API支持）
   */
  async getRealTimeGreeks(optionSymbol) {
    if (!this.futuAPI.isConnected) {
      throw new Error('实时Greeks数据需要富途OpenAPI连接');
    }
    
    try {
      const quote = await this.futuAPI.getOptionQuote(optionSymbol);
      return {
        symbol: quote.symbol,
        delta: quote.delta,
        gamma: quote.gamma,
        theta: quote.theta,
        vega: quote.vega,
        rho: quote.rho,
        timestamp: quote.timestamp,
        dataSource: 'Futu OpenAPI'
      };
    } catch (error) {
      throw new Error(`获取实时Greeks失败: ${error.message}`);
    }
  }

  /**
   * 获取期权历史数据（仅富途API支持）
   */
  async getOptionHistory(optionSymbol, period = '1D', count = 100) {
    if (!this.futuAPI.isConnected) {
      throw new Error('期权历史数据需要富途OpenAPI连接');
    }
    
    try {
      return await this.futuAPI.getOptionHistory(optionSymbol, period, count);
    } catch (error) {
      throw new Error(`获取期权历史数据失败: ${error.message}`);
    }
  }
}

module.exports = EnhancedDataSourceManager;