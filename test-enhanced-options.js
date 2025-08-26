#!/usr/bin/env node

/**
 * 测试增强的期权数据获取和权利金计算
 */

const YahooFinanceAPI = require('./server/yahooFinanceAPI');

async function testEnhancedOptions() {
  console.log('🚀 测试增强的期权数据获取...\n');
  
  const yahooAPI = new YahooFinanceAPI();
  
  try {
    // 1. 测试股票价格获取
    console.log('📈 测试获取AAPL股票价格...');
    const stockData = await yahooAPI.getStockPrice('AAPL');
    console.log('✅ 股票数据获取成功:');
    console.log(`- 当前价格: $${stockData.currentPrice}`);
    console.log(`- 前收盘价: $${stockData.previousClose}`);
    console.log(`- 交易所: ${stockData.exchange}`);
    console.log(`- 货币: ${stockData.currency}`);
    console.log(`- 更新时间: ${stockData.timestamp.toLocaleString()}\n`);
    
    // 2. 测试期权链获取
    console.log('📊 测试获取AAPL期权链...');
    const optionsData = await yahooAPI.getOptionsChain('AAPL');
    console.log('✅ 期权链数据获取成功:');
    console.log(`- 底层股票: ${optionsData.symbol}`);
    console.log(`- 可用到期日数量: ${optionsData.expirationDates.length}`);
    console.log(`- 看涨期权数量: ${optionsData.calls.length}`);
    console.log(`- 看跌期权数量: ${optionsData.puts.length}`);
    
    if (optionsData.calls.length > 0) {
      const call = optionsData.calls[0];
      console.log('\n📞 看涨期权示例:');
      console.log(`- 合约代码: ${call.contractSymbol}`);
      console.log(`- 行权价: $${call.strike}`);
      console.log(`- 最后价格: $${call.lastPrice || 'N/A'}`);
      console.log(`- 买价: $${call.bid || 'N/A'}`);
      console.log(`- 卖价: $${call.ask || 'N/A'}`);
      console.log(`- 成交量: ${call.volume || 0}`);
      console.log(`- 未平仓合约: ${call.openInterest || 0}`);
      console.log(`- 隐含波动率: ${(call.impliedVolatility * 100).toFixed(2)}%`);
      
      // 测试权利金计算
      const premium = yahooAPI.calculatePremium(call, stockData.currentPrice);
      console.log(`- 计算权利金: $${premium.toFixed(2)}`);
    }
    
    if (optionsData.puts.length > 0) {
      const put = optionsData.puts[0];
      console.log('\n📉 看跌期权示例:');
      console.log(`- 合约代码: ${put.contractSymbol}`);
      console.log(`- 行权价: $${put.strike}`);
      console.log(`- 最后价格: $${put.lastPrice || 'N/A'}`);
      console.log(`- 买价: $${put.bid || 'N/A'}`);
      console.log(`- 卖价: $${put.ask || 'N/A'}`);
      console.log(`- 成交量: ${put.volume || 0}`);
      console.log(`- 未平仓合约: ${put.openInterest || 0}`);
      console.log(`- 隐含波动率: ${(put.impliedVolatility * 100).toFixed(2)}%`);
      
      const premium = yahooAPI.calculatePremium(put, stockData.currentPrice);
      console.log(`- 计算权利金: $${premium.toFixed(2)}`);
    }
    
    // 3. 测试策略筛选
    console.log('\n🎯 测试现金担保看跌策略筛选...');
    const filteredPuts = yahooAPI.filterOptions(optionsData, stockData.currentPrice, 'cash-secured-put', 'moderate');
    console.log(`✅ 筛选出 ${filteredPuts.length} 个合适的看跌期权`);
    
    if (filteredPuts.length > 0) {
      console.log('\n推荐期权:');
      filteredPuts.slice(0, 3).forEach((option, index) => {
        const premium = yahooAPI.calculatePremium(option, stockData.currentPrice);
        const timeToExpiry = yahooAPI.getTimeToExpiry(option.expiration);
        console.log(`${index + 1}. ${option.contractSymbol}`);
        console.log(`   行权价: $${option.strike}, 权利金: $${premium.toFixed(2)}, 到期: ${Math.floor(timeToExpiry * 365)}天`);
      });
    }
    
    console.log('\n🎉 所有测试通过！Yahoo Finance API 可以获取真实的期权数据和权利金！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('- 网络连接问题');
    console.log('- Yahoo Finance API 临时不可用');
    console.log('- 股票代码不存在或没有期权数据');
    
    console.log('\n🔄 回退到增强模拟数据测试...');
    testEnhancedMockData();
  }
}

function testEnhancedMockData() {
  console.log('\n🎲 测试增强的模拟数据生成...');
  
  // 模拟Black-Scholes计算
  const calculateBlackScholesPremium = (type, stockPrice, strikePrice, timeToExpiry, volatility, riskFreeRate) => {
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
  };
  
  const currentPrice = 175.50; // AAPL 参考价格
  
  console.log('📊 Black-Scholes 期权定价示例:');
  console.log(`当前股价: $${currentPrice}`);
  
  // 测试不同行权价的看跌期权
  const strikes = [165, 170, 175, 180, 185];
  const timeToExpiry = 30 / 365; // 30天
  const volatility = 0.25; // 25%
  const riskFreeRate = 0.05; // 5%
  
  console.log('\n看跌期权定价 (30天到期):');
  strikes.forEach(strike => {
    const premium = calculateBlackScholesPremium('PUT', currentPrice, strike, timeToExpiry, volatility, riskFreeRate);
    const intrinsic = Math.max(0, strike - currentPrice);
    const timeValue = premium - intrinsic;
    
    console.log(`行权价 $${strike}: 权利金 $${premium.toFixed(2)} (内在价值: $${intrinsic.toFixed(2)}, 时间价值: $${timeValue.toFixed(2)})`);
  });
  
  console.log('\n看涨期权定价 (30天到期):');
  strikes.forEach(strike => {
    const premium = calculateBlackScholesPremium('CALL', currentPrice, strike, timeToExpiry, volatility, riskFreeRate);
    const intrinsic = Math.max(0, currentPrice - strike);
    const timeValue = premium - intrinsic;
    
    console.log(`行权价 $${strike}: 权利金 $${premium.toFixed(2)} (内在价值: $${intrinsic.toFixed(2)}, 时间价值: $${timeValue.toFixed(2)})`);
  });
  
  console.log('\n✅ 增强模拟数据测试完成！现在权利金计算更加真实和准确。');
}

// 执行测试
if (require.main === module) {
  testEnhancedOptions().catch(console.error);
}

module.exports = { testEnhancedOptions, testEnhancedMockData };