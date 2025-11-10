#!/usr/bin/env node

/**
 * 检查重定向 URI 配置
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         重定向 URI 配置检查                                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// 读取 .env 文件
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

// 解析 NEXTAUTH_URL
let nextauthUrl = '';
envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXTAUTH_URL=')) {
    nextauthUrl = trimmed.split('=')[1].trim();
  }
});

if (!nextauthUrl) {
  console.error('❌ 错误：未找到 NEXTAUTH_URL');
  process.exit(1);
}

console.log('📋 当前配置：\n');
console.log(`NEXTAUTH_URL: ${nextauthUrl}`);

// 构建重定向 URI
const redirectUri = `${nextauthUrl}/api/auth/callback/google`;

console.log('\n📍 应用使用的重定向 URI：\n');
console.log(`   ${redirectUri}`);

console.log('\n⚠️  请确保在 Google Cloud Console 中配置了完全相同的 URI！\n');

// 检查常见问题
console.log('✅ 配置检查清单：\n');

const checks = [
  {
    name: '协议',
    check: nextauthUrl.startsWith('http://') || nextauthUrl.startsWith('https://'),
    expected: 'http:// 或 https://',
    actual: nextauthUrl.split('://')[0] + '://'
  },
  {
    name: '域名',
    check: nextauthUrl.includes('localhost') || nextauthUrl.includes('127.0.0.1'),
    expected: 'localhost（开发环境）',
    actual: nextauthUrl.split('://')[1]?.split(':')[0] || '未知'
  },
  {
    name: '端口',
    check: nextauthUrl.includes(':3000'),
    expected: ':3000',
    actual: nextauthUrl.includes(':') ? ':' + nextauthUrl.split(':')[2] : '无端口'
  },
  {
    name: '末尾无斜杠',
    check: !nextauthUrl.endsWith('/'),
    expected: '无斜杠',
    actual: nextauthUrl.endsWith('/') ? '有斜杠 ❌' : '无斜杠 ✓'
  }
];

checks.forEach(check => {
  const status = check.check ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.actual}`);
  if (!check.check) {
    console.log(`   期望: ${check.expected}`);
  }
});

console.log('\n' + '═'.repeat(60) + '\n');

console.log('🔧 如何修复 redirect_uri_mismatch 错误：\n');
console.log('1. 访问 Google Cloud Console：');
console.log('   https://console.cloud.google.com/apis/credentials?project=ai-tasky\n');
console.log('2. 点击你的 OAuth 客户端 ID 进行编辑\n');
console.log('3. 在 "授权的重定向 URI" 中添加：');
console.log(`   ${redirectUri}\n`);
console.log('4. 点击 "保存"\n');
console.log('5. 清除浏览器缓存或使用无痕模式\n');
console.log('6. 重新访问：http://localhost:3000/auth/signin\n');

console.log('💡 提示：URI 必须完全匹配，包括协议、域名、端口和路径！\n');
