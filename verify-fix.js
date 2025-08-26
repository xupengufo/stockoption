#!/usr/bin/env node

/**
 * 验证Vercel部署配置修复脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证Vercel部署配置修复...\n');

// 1. 检查vercel.json配置
console.log('1. 检查vercel.json配置...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.env && Object.keys(vercelConfig.env).length === 0) {
    console.log('✅ vercel.json中已移除硬编码的环境变量');
  } else {
    console.log('❌ vercel.json中仍有硬编码的环境变量');
  }
  
  // 检查路由配置
  const hasApiRoute = vercelConfig.routes.some(route => route.src === '/api/(.*)');
  if (hasApiRoute) {
    console.log('✅ API路由配置正确');
  } else {
    console.log('❌ API路由配置缺失');
  }
} catch (error) {
  console.log('❌ vercel.json文件读取失败:', error.message);
}

// 2. 检查前端环境变量示例文件
console.log('\n2. 检查前端环境变量配置...');
if (fs.existsSync('client/.env.example')) {
  console.log('✅ client/.env.example文件已创建');
} else {
  console.log('❌ client/.env.example文件缺失');
}

// 3. 检查前端API配置修复
console.log('\n3. 检查前端API配置...');
try {
  const analyzerContent = fs.readFileSync('client/src/components/OptionsAnalyzer.tsx', 'utf8');
  
  if (analyzerContent.includes("process.env.NODE_ENV === 'production'")) {
    console.log('✅ 前端API配置已修复，支持生产环境自动路径');
  } else {
    console.log('❌ 前端API配置未修复');
  }
} catch (error) {
  console.log('❌ 前端文件读取失败:', error.message);
}

// 4. 检查服务器端API密钥处理
console.log('\n4. 检查服务器端配置...');
try {
  const serverContent = fs.readFileSync('server/index.js', 'utf8');
  
  if (serverContent.includes('process.env.POLYGON_API_KEY')) {
    console.log('✅ 服务器端正确使用环境变量读取API密钥');
  } else {
    console.log('❌ 服务器端API密钥配置有问题');
  }
  
  if (serverContent.includes('返回模拟数据')) {
    console.log('✅ 服务器端包含模拟数据回退机制');
  } else {
    console.log('❌ 服务器端缺少模拟数据机制');
  }
} catch (error) {
  console.log('❌ 服务器文件读取失败:', error.message);
}

console.log('\n📋 修复总结:');
console.log('• vercel.json: 移除硬编码API密钥，使用Vercel环境变量管理');
console.log('• 前端配置: 生产环境自动使用相对路径调用API');
console.log('• 环境变量: 提供配置示例和详细说明');
console.log('• 文档更新: 添加故障排除指南');

console.log('\n🚀 下一步操作:');
console.log('1. 在Vercel控制台中配置POLYGON_API_KEY环境变量');
console.log('2. 重新部署应用');
console.log('3. 测试API端点是否返回真实数据');
console.log('4. 验证前端是否正确显示数据');

console.log('\n✨ 配置验证完成！');