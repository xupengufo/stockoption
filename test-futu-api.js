#!/usr/bin/env node

/**
 * 富途OpenAPI连接测试脚本
 * 验证富途牛牛客户端OpenAPI是否正常工作
 */

const FutuOpenAPI = require('./server/futuOpenAPI');

async function testFutuAPI() {
  console.log('🧪 开始测试富途OpenAPI连接...\n');

  // 初始化富途API客户端
  const futuAPI = new FutuOpenAPI({
    host: 'localhost',
    port: 11111,
    timeout: 5000
  });

  try {
    // 1. 测试连接
    console.log('📡 测试富途OpenAPI连接状态...');
    const connected = await futuAPI.initialize();
    
    if (!connected) {
      console.log('❌ 富途OpenAPI连接失败');
      console.log('\n🛠️ 请检查：');
      console.log('• 富途牛牛客户端是否已启动？');
      console.log('• OpenAPI功能是否已开启？');
      console.log('• 端口11111是否可用？');
      console.log('• 防火墙是否阻止了连接？');
      return;
    }

    console.log('✅ 富途OpenAPI连接成功！\n');

    // 2. 测试股票信息获取
    console.log('📊 测试股票信息获取...');
    try {
      const stockInfo = await futuAPI.getStockInfo('AAPL');
      console.log('✅ 股票信息获取成功');
      console.log(`   股票代码: ${stockInfo.symbol}`);
      console.log(`   当前价格: $${stockInfo.currentPrice}`);
      console.log(`   数据来源: ${stockInfo.dataSource}\n`);
    } catch (error) {
      console.log(`⚠️ 股票信息获取失败: ${error.message}\n`);
    }

    // 3. 测试期权链获取
    console.log('🎯 测试期权链获取...');
    try {
      const optionChain = await futuAPI.getOptionChain('AAPL');
      console.log('✅ 期权链获取成功');
      console.log(`   Call期权数量: ${optionChain.calls.length}`);
      console.log(`   Put期权数量: ${optionChain.puts.length}`);
      console.log(`   数据来源: ${optionChain.dataSource}\n`);
    } catch (error) {
      console.log(`⚠️ 期权链获取失败: ${error.message}\n`);
    }

    // 4. 测试期权报价
    console.log('💰 测试期权实时报价...');
    try {
      // 使用常见的AAPL期权代码进行测试
      const optionSymbol = 'AAPL240216C00180000'; // 示例期权代码
      const quote = await futuAPI.getOptionQuote(optionSymbol);
      console.log('✅ 期权报价获取成功');
      console.log(`   期权代码: ${quote.symbol}`);
      console.log(`   最新价格: $${quote.lastPrice}`);
      console.log(`   买入价: $${quote.bid}`);
      console.log(`   卖出价: $${quote.ask}`);
      console.log(`   隐含波动率: ${(quote.impliedVolatility * 100).toFixed(2)}%`);
      console.log(`   Delta: ${quote.delta}`);
      console.log(`   数据来源: ${quote.dataSource}\n`);
    } catch (error) {
      console.log(`⚠️ 期权报价获取失败: ${error.message}`);
      console.log('   (这是正常的，因为期权代码可能不存在或无权限)\n');
    }

    console.log('🎉 富途OpenAPI测试完成！');
    console.log('\n📝 测试结果总结：');
    console.log('• 基础连接：✅ 正常');
    console.log('• 股票数据：根据上述结果');
    console.log('• 期权数据：根据上述结果');
    console.log('\n🚀 您现在可以在项目中使用富途OpenAPI获取真实期权数据了！');

  } catch (error) {
    console.error('❌ 富途API测试失败:', error.message);
    console.log('\n🔧 故障排除建议：');
    console.log('1. 确保富途牛牛客户端已启动并登录');
    console.log('2. 检查OpenAPI设置是否已启用');
    console.log('3. 验证端口11111是否未被占用');
    console.log('4. 检查网络连接和防火墙设置');
    console.log('5. 确认富途账户具有相应的数据权限');
  }
}

// 运行测试
if (require.main === module) {
  testFutuAPI().catch(console.error);
}

module.exports = testFutuAPI;