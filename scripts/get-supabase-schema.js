/**
 * Supabase 数据库结构获取脚本
 * 
 * 使用方法：
 * 1. npm install @supabase/supabase-js
 * 2. node scripts/get-supabase-schema.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read configuration from .env
const SUPABASE_URL = 'https://nkpgzczvxuhbqrifjuer.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcGd6Y3p2eHVoYnFyaWZqdWVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzA2ODc2MiwiZXhwIjoyMDcyNjQ0NzYyfQ.4EEs2YbHZEzkkSt3qOSQ9NiqPgwJE-COmPX_wu8ZI9Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function getDatabaseSchema() {
  console.log('🔍 Fetching database schema from Supabase...\n');

  try {
    // 1. Get all tables
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables', {});

    if (tablesError) {
      console.log('⚠️  RPC function not available, using direct SQL query...\n');
      
      // Fallback: Direct SQL query
      const queries = [
        {
          name: 'Tables',
          sql: `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
          `
        },
        {
          name: 'Columns',
          sql: `
            SELECT 
              table_name,
              column_name,
              data_type,
              is_nullable,
              column_default
            FROM information_schema.columns
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
          `
        }
      ];

      let output = '# Supabase Database Schema\n\n';
      output += `Generated at: ${new Date().toISOString()}\n\n`;

      for (const query of queries) {
        console.log(`📊 Fetching ${query.name}...`);
        
        const { data, error } = await supabase
          .from('_sql')
          .select('*')
          .sql(query.sql);

        if (error) {
          console.error(`❌ Error fetching ${query.name}:`, error.message);
          output += `\n## ${query.name}\nError: ${error.message}\n`;
        } else {
          output += `\n## ${query.name}\n\n`;
          output += '```json\n';
          output += JSON.stringify(data, null, 2);
          output += '\n```\n';
          console.log(`✅ ${query.name} fetched successfully`);
        }
      }

      // Save to file
      fs.writeFileSync('supabase-schema.md', output);
      console.log('\n✅ Schema saved to supabase-schema.md');
      
      return;
    }

    // If RPC available, use RPC
    console.log('✅ Tables found:', tables);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Alternative: Please run the SQL queries manually in Supabase SQL Editor');
    console.log('   File: scripts/get-supabase-schema.sql\n');
  }
}

// Fallback: Generate Prisma introspection command
function generatePrismaIntrospection() {
  console.log('\n📝 Alternative: Use Prisma Introspection\n');
  console.log('1. Update your .env with DATABASE_URL:');
  console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.nkpgzczvxuhbqrifjuer.supabase.co:5432/postgres"\n');
  console.log('2. Run: npx prisma db pull');
  console.log('3. This will generate prisma/schema.prisma from your database\n');
}

// Execute
getDatabaseSchema().then(() => {
  generatePrismaIntrospection();
});
