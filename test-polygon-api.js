#!/usr/bin/env node

/**
 * Polygon.io API测试脚本
 * 验证API密钥配置和数据获取功能
 */

const PolygonDataSourceManager = require('./server/polygonDataSourceManager');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

async function testPolygonAPI() {
  console.log('🧪 开始测试Polygon.io API...\n');

  const polygonManager = new PolygonDataSourceManager();

  // 1. 检查API密钥配置
  console.log('🔑 检查API密钥配置...');
  if (!polygonManager.isAvailable()) {
    console.log('❌ Polygon.io API密钥未配置或无效');
    console.log('当前API密钥:', process.env.POLYGON_API_KEY || '未设置');
    console.log('\n🛠️ 解决方案：');
    console.log('1. 访问 https://polygon.io/ 注册账号');
    console.log('2. 获取API密钥');
    console.log('3. 在 server/.env 文件中设置 POLYGON_API_KEY=你的密钥');
    return;
  }

  console.log('✅ API密钥已配置');
  console.log('API密钥前缀:', process.env.POLYGON_API_KEY.substring(0, 8) + '...\n');

  try {
    // 2. 测试股票价格获取
    console.log('📊 测试股票价格获取...');
    const stockData = await polygonManager.getStockPrice('AAPL');
    console.log('✅ 股票数据获取成功');
    console.log(`   股票代码: ${stockData.symbol}`);
    console.log(`   当前价格: $${stockData.currentPrice}`);
    console.log(`   开盘价: $${stockData.open}`);
    console.log(`   最高价: $${stockData.high}`);
    console.log(`   最低价: $${stockData.low}`);
    console.log(`   成交量: ${stockData.volume?.toLocaleString()}`);
    console.log(`   数据来源: ${stockData.dataSource}\n`);

    // 3. 测试期权链获取
    console.log('🎯 测试期权链获取...');
    const optionChain = await polygonManager.getOptionChain('AAPL');
    console.log('✅ 期权链获取成功');
    console.log(`   Call期权数量: ${optionChain.calls.length}`);
    console.log(`   Put期权数量: ${optionChain.puts.length}`);
    console.log(`   数据来源: ${optionChain.dataSource}`);
    
    if (optionChain.calls.length > 0) {
      const sampleCall = optionChain.calls[0];
      console.log(`   示例Call期权: ${sampleCall.contractSymbol}`);
      console.log(`   行权价: $${sampleCall.strike}`);
      console.log(`   到期日: ${sampleCall.expirationDate}`);
    }
    console.log('');

    // 4. 测试策略分析
    console.log('💰 测试期权策略分析...');
    const recommendations = await polygonManager.getOptionsForStrategy('AAPL', 'cash-secured-put', 'moderate');
    console.log('✅ 策略分析完成');
    console.log(`   推荐期权数量: ${recommendations.length}`);
    
    if (recommendations.length > 0) {
      const bestRec = recommendations[0];
      console.log(`   最佳推荐:`);
      console.log(`   - 类型: ${bestRec.type}`);
      console.log(`   - 行权价: $${bestRec.strike}`);
      console.log(`   - 权利金: $${bestRec.premium}`);
      console.log(`   - 到期日: ${bestRec.expiration}`);
      console.log(`   - 成功概率: ${(bestRec.probability * 100).toFixed(1)}%`);
      console.log(`   - 年化收益率: ${(bestRec.annualizedReturn * 100).toFixed(2)}%`);
    }
    console.log('');

    // 5. 测试不同股票
    console.log('📈 测试其他股票...');
    const symbols = ['MSFT', 'GOOGL', 'TSLA'];
    
    for (const symbol of symbols) {
      try {
        const data = await polygonManager.getStockPrice(symbol);
        console.log(`✅ ${symbol}: $${data.currentPrice}`);
      } catch (error) {
        console.log(`⚠️ ${symbol}: ${error.message}`);
      }
    }

    console.log('\n🎉 Polygon.io API测试完成！');
    console.log('\n📝 测试结果总结：');
    console.log('• API密钥配置：✅ 正常');
    console.log('• 股票数据获取：✅ 正常');
    console.log('• 期权链数据：✅ 正常');
    console.log('• 策略分析：✅ 正常');
    console.log('\n🚀 您现在可以在项目中使用Polygon.io获取真实金融数据了！');
    console.log('\n💡 使用建议：');
    console.log('• 前端选择"Polygon.io"数据源获得最佳体验');
    console.log('• 生产环境中设置环境变量POLYGON_API_KEY');
    console.log('• 注意API调用频率限制，避免超出配额');

  } catch (error) {
    console.error('❌ Polygon.io API测试失败:', error.message);
    console.log('\n🔧 故障排除建议：');
    console.log('1. 检查网络连接');
    console.log('2. 验证API密钥是否有效');
    console.log('3. 确认Polygon.io账户状态和配额');
    console.log('4. 检查股票代码是否正确');
    
    if (error.message.includes('401')) {
      console.log('5. API密钥认证失败，请检查密钥格式');
    } else if (error.message.includes('429')) {
      console.log('5. API调用频率超限，请稍后重试');
    } else if (error.message.includes('403')) {
      console.log('5. API权限不足，可能需要升级账户计划');
    }
  }
}

// 运行测试
if (require.main === module) {
  testPolygonAPI().catch(console.error);
}

module.exports = testPolygonAPI;