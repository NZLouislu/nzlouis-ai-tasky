#!/usr/bin/env node

/**
 * Google OAuth 配置检查脚本
 * 
 * 用法：node scripts/check-oauth-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║         Google OAuth 配置检查                              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// 读取 .env 文件
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.error('❌ 错误：找不到 .env 文件');
  console.log('\n请在项目根目录创建 .env 文件\n');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');

// 解析环境变量
const env = {};
envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    env[key.trim()] = value;
  }
});

// 检查必需的配置
const checks = [
  {
    name: 'NEXTAUTH_URL',
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, message: '未设置' };
      if (!value.startsWith('http')) return { valid: false, message: '必须以 http:// 或 https:// 开头' };
      return { valid: true, message: value };
    }
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, message: '未设置' };
      if (value.length < 32) return { valid: false, message: '长度太短（建议至少 32 字符）' };
      return { valid: true, message: '已设置 ✓' };
    }
  },
  {
    name: 'GOOGLE_CLIENT_ID',
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, message: '未设置 - 请查看 docs/GOOGLE_OAUTH_快速指南.md' };
      if (!value.includes('.apps.googleusercontent.com')) {
        return { valid: false, message: '格式不正确（应该包含 .apps.googleusercontent.com）' };
      }
      return { valid: true, message: value.substring(0, 30) + '...' };
    }
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, message: '未设置 - 请查看 docs/GOOGLE_OAUTH_快速指南.md' };
      if (!value.startsWith('GOCSPX-')) {
        return { valid: false, message: '格式不正确（应该以 GOCSPX- 开头）' };
      }
      return { valid: true, message: 'GOCSPX-****** (已隐藏)' };
    }
  },
  {
    name: 'AI_ENCRYPTION_KEY',
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, message: '未设置' };
      if (value.length < 32) return { valid: false, message: '长度太短（建议至少 32 字符）' };
      return { valid: true, message: '已设置 ✓' };
    }
  },
  {
    name: 'DATABASE_URL',
    required: true,
    validate: (value) => {
      if (!value) return { valid: false, message: '未设置' };
      if (!value.startsWith('postgresql://')) {
        return { valid: false, message: '格式不正确（应该以 postgresql:// 开头）' };
      }
      return { valid: true, message: '已设置 ✓' };
    }
  }
];

// 可选配置
const optionalChecks = [
  'GOOGLE_API_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'OPENROUTER_API_KEY',
  'KILO_API_KEY'
];

console.log('📋 必需配置检查：\n');

let allValid = true;
checks.forEach(check => {
  const value = env[check.name];
  const result = check.validate(value);
  
  const status = result.valid ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  console.log(`   ${result.message}\n`);
  
  if (!result.valid) {
    allValid = false;
  }
});

console.log('\n📋 可选配置（AI 提供商回退密钥）：\n');

let hasOptional = false;
optionalChecks.forEach(key => {
  const value = env[key];
  if (value) {
    console.log(`✅ ${key}: 已设置`);
    hasOptional = true;
  } else {
    console.log(`⚪ ${key}: 未设置（可选）`);
  }
});

if (!hasOptional) {
  console.log('\n💡 提示：可以添加 AI 提供商的 API 密钥作为回退选项');
  console.log('   用户未配置自己的密钥时，将使用这些回退密钥\n');
}

console.log('\n' + '═'.repeat(60) + '\n');

if (allValid) {
  console.log('🎉 配置检查通过！\n');
  console.log('下一步：');
  console.log('1. 运行数据库迁移：npx prisma migrate deploy');
  console.log('2. 启动开发服务器：npm run dev');
  console.log('3. 访问：http://localhost:3000/auth/signin\n');
} else {
  console.log('❌ 配置检查失败！\n');
  console.log('请修复上述错误后重试。\n');
  console.log('📖 配置指南：');
  console.log('   - 快速指南：docs/GOOGLE_OAUTH_快速指南.md');
  console.log('   - 完整文档：docs/GOOGLE_OAUTH_SETUP.md');
  console.log('   - 作用说明：docs/GOOGLE_OAUTH_配置作用说明.md\n');
  process.exit(1);
}

// 检查重定向 URI 配置
console.log('⚠️  重要提醒：\n');
console.log('确保在 Google Cloud Console 中配置了正确的重定向 URI：');
console.log(`   ${env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google\n`);
console.log('如果重定向 URI 不匹配，登录将失败！\n');
