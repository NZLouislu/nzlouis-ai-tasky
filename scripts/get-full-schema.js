/**
 * 获取完整数据库结构
 * 包括主键、外键、索引等
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function getFullSchema() {
  console.log('🔍 Fetching complete database schema...\n');
  
  let output = '-- ============================================\n';
  output += '-- 完整数据库结构（自动生成）\n';
  output += `-- 生成时间: ${new Date().toISOString()}\n`;
  output += '-- ============================================\n\n';

  try {
    // 3. 主键约束
    console.log('📋 Fetching primary keys...');
    const primaryKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        kcu.column_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
      ORDER BY 
        tc.table_name
    `;
    
    output += '-- ============================================\n';
    output += '-- 3. 主键约束\n';
    output += '-- ============================================\n\n';
    primaryKeys.forEach(pk => {
      output += `-- ${pk.table_name}.${pk.column_name} (${pk.constraint_name})\n`;
    });
    output += '\n';
    console.log(`✅ Found ${primaryKeys.length} primary keys\n`);

    // 4. 外键约束
    console.log('📋 Fetching foreign keys...');
    const foreignKeys = await prisma.$queryRaw`
      SELECT
        tc.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column,
        tc.constraint_name
      FROM 
        information_schema.table_constraints AS tc
      JOIN 
        information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN 
        information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY 
        tc.table_name
    `;
    
    output += '-- ============================================\n';
    output += '-- 4. 外键约束\n';
    output += '-- ============================================\n\n';
    foreignKeys.forEach(fk => {
      output += `-- ${fk.from_table}.${fk.from_column} → ${fk.to_table}.${fk.to_column}\n`;
      output += `--   (${fk.constraint_name})\n`;
    });
    output += '\n';
    console.log(`✅ Found ${foreignKeys.length} foreign keys\n`);

    // 5. 索引
    console.log('📋 Fetching indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        schemaname = 'public'
      ORDER BY
        tablename, indexname
    `;
    
    output += '-- ============================================\n';
    output += '-- 5. 索引\n';
    output += '-- ============================================\n\n';
    indexes.forEach(idx => {
      output += `-- ${idx.tablename}.${idx.indexname}\n`;
      output += `--   ${idx.indexdef}\n\n`;
    });
    console.log(`✅ Found ${indexes.length} indexes\n`);

    // 6. Unique constraints
    console.log('📋 Fetching unique constraints...');
    const uniqueConstraints = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        kcu.column_name,
        tc.constraint_name
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE 
        tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
      ORDER BY 
        tc.table_name
    `;
    
    output += '-- ============================================\n';
    output += '-- 6. Unique Constraints\n';
    output += '-- ============================================\n\n';
    uniqueConstraints.forEach(uc => {
      output += `-- ${uc.table_name}.${uc.column_name} (${uc.constraint_name})\n`;
    });
    output += '\n';
    console.log(`✅ Found ${uniqueConstraints.length} unique constraints\n`);

    // 8. Table row counts
    console.log('📋 Fetching row counts...');
    const rowCounts = await prisma.$queryRaw`
      SELECT 
        schemaname,
        relname AS table_name,
        n_live_tup AS row_count
      FROM 
        pg_stat_user_tables
      WHERE 
        schemaname = 'public'
      ORDER BY 
        n_live_tup DESC
    `;
    
    output += '-- ============================================\n';
    output += '-- 8. Table Row Counts\n';
    output += '-- ============================================\n\n';
    rowCounts.forEach(rc => {
      output += `-- ${rc.table_name}: ${rc.row_count} rows\n`;
    });
    output += '\n';
    console.log(`✅ Found row counts for ${rowCounts.length} tables\n`);

    // Save to file
    const outputPath = 'lib/db/auto-generated-schema.sql';
    fs.writeFileSync(outputPath, output);
    console.log(`\n✅ Schema saved to ${outputPath}`);
    
    // Generate summary
    console.log('\n📊 Summary:');
    console.log(`  - Tables: 10`);
    console.log(`  - Primary Keys: ${primaryKeys.length}`);
    console.log(`  - Foreign Keys: ${foreignKeys.length}`);
    console.log(`  - Indexes: ${indexes.length}`);
    console.log(`  - Unique Constraints: ${uniqueConstraints.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getFullSchema();
