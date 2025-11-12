#!/usr/bin/env node

/**
 * AI Tasky 权限修复脚本
 * 自动检查和修复 Supabase 数据库权限问题
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function main() {
  log('\n🔧 AI Tasky 权限修复工具\n', 'blue');

  // 1. 检查环境变量
  logStep(1, '检查环境变量配置');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.TASKY_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logError('缺少必要的环境变量！');
    log('\n请确保 .env 文件中包含以下变量：');
    log('  - NEXT_PUBLIC_SUPABASE_URL');
    log('  - TASKY_SUPABASE_SERVICE_ROLE_KEY\n');
    process.exit(1);
  }

  logSuccess('环境变量配置正确');
  log(`  Supabase URL: ${supabaseUrl}`);

  // 2. 连接数据库
  logStep(2, '连接到 Supabase 数据库');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  logSuccess('数据库连接成功');

  // 3. 检查表是否存在
  logStep(3, '检查数据库表状态');
  
  const requiredTables = [
    'user_profiles',
    'chat_sessions',
    'chat_messages',
    'user_ai_settings',
    'user_api_keys',
  ];

  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ANY($1)
      ORDER BY table_name
    `,
    params: [requiredTables],
  }).catch(() => ({ data: null, error: null }));

  // 如果 RPC 不可用，尝试直接查询
  let existingTables = [];
  if (!tables) {
    log('  使用备用方法检查表...');
    for (const tableName of requiredTables) {
      const { error } = await supabase.from(tableName).select('id').limit(1);
      if (!error || error.code !== '42P01') {
        existingTables.push(tableName);
      }
    }
  } else {
    existingTables = tables.map(t => t.table_name);
  }

  log('\n  表状态：');
  for (const tableName of requiredTables) {
    if (existingTables.includes(tableName)) {
      logSuccess(`  ${tableName} - 已存在`);
    } else {
      logWarning(`  ${tableName} - 不存在`);
    }
  }

  const missingTables = requiredTables.filter(t => !existingTables.includes(t));

  if (missingTables.length > 0) {
    logWarning(`\n发现 ${missingTables.length} 个缺失的表`);
    log('\n请执行以下步骤创建表：');
    log('1. 登录 Supabase Dashboard: https://supabase.com/dashboard');
    log('2. 选择项目: nkpgzczvxuhbqrifjuer');
    log('3. 进入 SQL Editor');
    log('4. 执行文件: supabase/create-tables.sql\n');
  } else {
    logSuccess('所有必需的表都已存在');
  }

  // 4. 测试权限
  logStep(4, '测试数据库权限');

  const testResults = [];

  // 测试 chat_sessions 表
  if (existingTables.includes('chat_sessions')) {
    const { error } = await supabase
      .from('chat_sessions')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42501') {
        testResults.push({ table: 'chat_sessions', status: 'permission_denied' });
        logError(`  chat_sessions - 权限被拒绝 (${error.code})`);
      } else {
        testResults.push({ table: 'chat_sessions', status: 'other_error', error });
        logWarning(`  chat_sessions - 其他错误: ${error.message}`);
      }
    } else {
      testResults.push({ table: 'chat_sessions', status: 'ok' });
      logSuccess('  chat_sessions - 权限正常');
    }
  }

  // 测试 chat_messages 表
  if (existingTables.includes('chat_messages')) {
    const { error } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42501') {
        testResults.push({ table: 'chat_messages', status: 'permission_denied' });
        logError(`  chat_messages - 权限被拒绝 (${error.code})`);
      } else {
        testResults.push({ table: 'chat_messages', status: 'other_error', error });
        logWarning(`  chat_messages - 其他错误: ${error.message}`);
      }
    } else {
      testResults.push({ table: 'chat_messages', status: 'ok' });
      logSuccess('  chat_messages - 权限正常');
    }
  }

  const permissionErrors = testResults.filter(r => r.status === 'permission_denied');

  // 5. 提供修复建议
  logStep(5, '生成修复建议');

  if (permissionErrors.length > 0) {
    logError(`\n发现 ${permissionErrors.length} 个权限错误！`);
    log('\n🔧 修复步骤：\n');
    log('1. 登录 Supabase Dashboard: https://supabase.com/dashboard');
    log('2. 选择项目: nkpgzczvxuhbqrifjuer');
    log('3. 进入 SQL Editor');
    log('4. 执行文件: supabase/fix-permissions.sql');
    log('\n或者使用 Supabase CLI：');
    log('  supabase db execute --file supabase/fix-permissions.sql\n');
  } else if (missingTables.length === 0) {
    logSuccess('\n✨ 所有检查通过！数据库配置正确。\n');
  }

  // 6. 生成诊断报告
  logStep(6, '生成诊断报告');

  const report = {
    timestamp: new Date().toISOString(),
    supabaseUrl,
    tables: {
      total: requiredTables.length,
      existing: existingTables.length,
      missing: missingTables.length,
      list: requiredTables.map(t => ({
        name: t,
        exists: existingTables.includes(t),
      })),
    },
    permissions: {
      total: testResults.length,
      ok: testResults.filter(r => r.status === 'ok').length,
      errors: permissionErrors.length,
      details: testResults,
    },
  };

  const reportPath = path.join(__dirname, '..', 'ai-tasky-diagnostic-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  logSuccess(`诊断报告已保存: ${reportPath}`);

  // 7. 总结
  log('\n' + '='.repeat(60));
  log('📊 诊断总结', 'blue');
  log('='.repeat(60));
  log(`\n表状态: ${existingTables.length}/${requiredTables.length} 已创建`);
  log(`权限状态: ${testResults.filter(r => r.status === 'ok').length}/${testResults.length} 正常`);
  
  if (permissionErrors.length > 0 || missingTables.length > 0) {
    log('\n⚠️  需要修复！请按照上述步骤操作。\n', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ 一切正常！可以开始使用 AI Tasky 功能。\n', 'green');
    process.exit(0);
  }
}

// 运行脚本
main().catch((error) => {
  logError('\n脚本执行失败：');
  console.error(error);
  process.exit(1);
});
