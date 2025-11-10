const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('Reading migration SQL...');
    const sql = fs.readFileSync('scripts/migrate-to-ai-tasky.sql', 'utf8');
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing...`);
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Success`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Already exists, skipping`);
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n✅ Migration completed!');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`\n📊 Total tables: ${tables.length}`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
