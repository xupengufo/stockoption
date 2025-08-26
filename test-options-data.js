#!/usr/bin/env node

/**
 * 期权数据获取测试脚本
 * 用于诊断权利金显示为0的问题
 */

const axios = require('./server/node_modules/axios');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_BASE_URL = 'https://api.polygon.io';

async function testPolygonOptionsData() {
  console.log('🔍 测试Polygon.io期权数据获取...\n');
  
  if (!POLYGON_API_KEY || POLYGON_API_KEY === 'your_polygon_api_key_here') {
    console.log('❌ API密钥未配置或使用默认值');
    console.log('当前API密钥:', POLYGON_API_KEY || '未设置');
    return;
  }
  
  console.log('✅ API密钥已配置');
  console.log('API密钥前缀:', POLYGON_API_KEY.substring(0, 8) + '...\n');
  
  try {
    // 1. 测试获取期权合约列表
    console.log('📈 测试获取AAPL期权合约列表...');
    const contractsResponse = await axios.get(
      `${POLYGON_BASE_URL}/v3/reference/options/contracts`,
      {
        params: {
          underlying_ticker: 'AAPL',
          limit: 10,
          apikey: POLYGON_API_KEY
        },
        timeout: 10000
      }
    );
    
    console.log('响应状态:', contractsResponse.status);
    console.log('合约数量:', contractsResponse.data.results?.length || 0);
    
    if (contractsResponse.data.results && contractsResponse.data.results.length > 0) {
      const contract = contractsResponse.data.results[0];
      console.log('第一个合约示例:');
      console.log('- 合约代码:', contract.ticker);
      console.log('- 类型:', contract.contract_type);
      console.log('- 行权价:', contract.strike_price);
      console.log('- 到期日:', contract.expiration_date);
      console.log('- 底层股票:', contract.underlying_ticker);
      
      // 2. 测试获取该期权的实时报价
      console.log('\n💰 测试获取期权实时报价...');
      try {
        const quoteResponse = await axios.get(
          `${POLYGON_BASE_URL}/v3/quotes/${contract.ticker}`,
          {
            params: {
              apikey: POLYGON_API_KEY
            },
            timeout: 10000
          }
        );
        
        console.log('报价响应状态:', quoteResponse.status);
        if (quoteResponse.data.results && quoteResponse.data.results.length > 0) {
          const quote = quoteResponse.data.results[0];
          console.log('最新报价:');
          console.log('- 买价 (Bid):', quote.bid || 'N/A');
          console.log('- 卖价 (Ask):', quote.ask || 'N/A');
          console.log('- 中间价:', quote.bid && quote.ask ? ((quote.bid + quote.ask) / 2).toFixed(2) : 'N/A');
          console.log('- 时间戳:', new Date(quote.timeframe || Date.now()).toLocaleString());
        } else {
          console.log('❌ 未找到报价数据');
        }
      } catch (quoteError) {
        console.log('❌ 获取期权报价失败:', quoteError.response?.status, quoteError.response?.data?.error || quoteError.message);
      }
      
      // 3. 测试聚合数据API
      console.log('\n📊 测试期权聚合数据...');
      try {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        const aggsResponse = await axios.get(
          `${POLYGON_BASE_URL}/v2/aggs/ticker/${contract.ticker}/range/1/day/${dateStr}/${dateStr}`,
          {
            params: {
              adjusted: true,
              apikey: POLYGON_API_KEY
            },
            timeout: 10000
          }
        );
        
        console.log('聚合数据响应状态:', aggsResponse.status);
        if (aggsResponse.data.results && aggsResponse.data.results.length > 0) {
          const agg = aggsResponse.data.results[0];
          console.log('聚合数据:');
          console.log('- 开盘价:', agg.o);
          console.log('- 最高价:', agg.h);
          console.log('- 最低价:', agg.l);
          console.log('- 收盘价:', agg.c);
          console.log('- 成交量:', agg.v);
        } else {
          console.log('❌ 未找到聚合数据');
        }
      } catch (aggsError) {
        console.log('❌ 获取聚合数据失败:', aggsError.response?.status, aggsError.response?.data?.error || aggsError.message);
      }
      
    } else {
      console.log('❌ 未找到期权合约数据');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.status, error.response?.data?.error || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 可能的原因:');
      console.log('- API密钥无效或已过期');
      console.log('- API密钥权限不足');
    } else if (error.response?.status === 403) {
      console.log('\n💡 可能的原因:');
      console.log('- API密钥对期权数据没有访问权限');
      console.log('- 需要升级到更高级别的Polygon.io计划');
    } else if (error.response?.status === 429) {
      console.log('\n💡 可能的原因:');
      console.log('- API请求频率超限');
      console.log('- 免费版本有较严格的速率限制');
    }
  }
}

async function checkAlternativeDataSources() {
  console.log('\n🔍 检查其他数据源选项...\n');
  
  console.log('📚 替代期权数据源:');
  console.log('1. **Yahoo Finance API** (免费)');
  console.log('   - 支持期权链数据');
  console.log('   - 有一定的权利金数据');
  console.log('   - 限制: 非官方API，可能不稳定');
  
  console.log('2. **Alpha Vantage** (免费/付费)');
  console.log('   - 提供期权数据');
  console.log('   - 免费版本有限制');
  console.log('   - 需要注册API密钥');
  
  console.log('3. **IEX Cloud** (免费/付费)');
  console.log('   - 提供期权数据');
  console.log('   - 免费额度有限');
  console.log('   - 较稳定的API');
  
  console.log('4. **Finnhub** (免费/付费)');
  console.log('   - 提供期权数据');
  console.log('   - 免费版本功能有限');
  console.log('   - 支持实时数据');
  
  console.log('5. **模拟数据生成** (免费)');
  console.log('   - 基于Black-Scholes模型计算理论价格');
  console.log('   - 使用股票价格、波动率等参数');
  console.log('   - 适合演示和测试');
}

// 执行测试
async function main() {
  await testPolygonOptionsData();
  await checkAlternativeDataSources();
  
  console.log('\n💡 建议:');
  console.log('1. 检查Polygon.io账户计划是否支持期权数据');
  console.log('2. 考虑使用替代数据源');
  console.log('3. 实现更完善的模拟数据生成');
  console.log('4. 添加多数据源支持');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPolygonOptionsData, checkAlternativeDataSources };