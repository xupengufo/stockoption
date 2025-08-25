const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';

async function testAPI() {
  console.log('🧪 测试API连接...\n');

  try {
    // 测试股票数据API
    console.log('📊 测试股票数据API...');
    const stockResponse = await axios.get(`${API_BASE_URL}/api/stock/AAPL`);
    console.log('✅ 股票数据API正常');
    console.log(`AAPL当前价格: $${stockResponse.data.results?.[0]?.c || 'N/A'}\n`);

    // 测试分析API
    console.log('🎯 测试策略分析API...');
    const analysisResponse = await axios.post(`${API_BASE_URL}/api/analyze`, {
      symbol: 'AAPL',
      strategy: 'cash-secured-put',
      riskTolerance: 'moderate'
    });
    console.log('✅ 策略分析API正常');
    console.log(`推荐策略数量: ${analysisResponse.data.recommendations?.length || 0}\n`);

    console.log('🎉 所有API测试通过！');
  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;