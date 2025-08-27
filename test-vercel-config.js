#!/usr/bin/env node

/**
 * Vercel环境变量配置测试脚本
 * 验证Polygon.io API密钥在Vercel环境中的配置状态
 */

const axios = require('./server/node_modules/axios');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

async function testVercelConfig() {
  console.log('🔍 测试Vercel环境变量配置...\n');
  
  // 1. 检查本地环境变量
  console.log('📋 本地环境变量检查:');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
  console.log(`POLYGON_API_KEY: ${process.env.POLYGON_API_KEY ? process.env.POLYGON_API_KEY.substring(0, 8) + '...' : '未设置'}\n`);
  
  // 2. 测试本地API状态
  console.log('🏠 测试本地API状态...');
  try {
    const localResponse = await axios.get('http://localhost:3001/api/data-sources/status');
    console.log('✅ 本地API连接成功');
    console.log(`Polygon.io状态: ${localResponse.data.polygon?.available ? '可用' : '不可用'}`);
    if (localResponse.data.polygon?.keyConfigured) {
      console.log('✅ 本地API密钥已配置');
    } else {
      console.log('❌ 本地API密钥未配置');
    }
  } catch (error) {
    console.log('❌ 本地API连接失败:', error.message);
    console.log('💡 提示: 请先启动本地服务器 (npm run dev)');
  }
  
  console.log('\n🌐 Vercel部署检查...');
  
  // 3. 提供Vercel配置指导
  console.log('📝 Vercel环境变量配置步骤:');
  console.log('1. 访问 https://vercel.com/dashboard');
  console.log('2. 选择您的项目');
  console.log('3. 进入 Settings → Environment Variables');
  console.log('4. 添加新变量:');
  console.log('   - Name: POLYGON_API_KEY');
  console.log('   - Value: 您的Polygon.io API密钥');
  console.log('   - Environment: Production, Preview, Development (全选)');
  console.log('5. 点击Save');
  console.log('6. 重新部署项目或触发新部署\n');
  
  // 4. 测试公开的Vercel应用
  const vercelUrl = process.argv[2]; // 可以通过命令行参数传递Vercel URL
  
  if (vercelUrl) {
    console.log(`🚀 测试Vercel部署: ${vercelUrl}`);
    try {
      const vercelResponse = await axios.get(`${vercelUrl}/api/data-sources/status`, {
        timeout: 10000
      });
      
      console.log('✅ Vercel API连接成功');
      console.log(`Polygon.io状态: ${vercelResponse.data.polygon?.available ? '可用' : '不可用'}`);
      
      if (vercelResponse.data.polygon?.available) {
        console.log('🎉 Polygon.io API在Vercel中工作正常！');
      } else {
        console.log('⚠️ Polygon.io API在Vercel中不可用');
        console.log('可能原因:');
        console.log('• 环境变量POLYGON_API_KEY未正确设置');
        console.log('• API密钥无效或已过期');
        console.log('• 需要重新部署以加载新的环境变量');
        
        if (vercelResponse.data.polygon?.testResult) {
          console.log('错误详情:', vercelResponse.data.polygon.testResult.error);
        }
      }
      
      console.log('\n📊 服务器信息:');
      console.log(`环境: ${vercelResponse.data.serverInfo?.nodeEnv || 'unknown'}`);
      console.log(`API密钥状态: ${vercelResponse.data.serverInfo?.polygonKeyStatus || 'unknown'}`);
      
    } catch (error) {
      console.log('❌ Vercel API连接失败:', error.message);
      if (error.response) {
        console.log(`HTTP状态: ${error.response.status}`);
      }
    }
  } else {
    console.log('💡 使用方法: node test-vercel-config.js https://your-app.vercel.app');
  }
  
  console.log('\n🔧 故障排除建议:');
  console.log('1. 确保在Vercel中正确设置了POLYGON_API_KEY环境变量');
  console.log('2. 检查API密钥是否有效（访问 https://polygon.io/dashboard）');
  console.log('3. 重新部署Vercel应用以加载新的环境变量');
  console.log('4. 在网页中使用"Polygon.io状态诊断"工具');
  console.log('5. 检查浏览器控制台是否有错误信息');
}

// 运行测试
if (require.main === module) {
  testVercelConfig().catch(console.error);
}

module.exports = testVercelConfig;