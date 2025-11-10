const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserProfilesForeignKey() {
  try {
    console.log('Checking for foreign key constraint...');
    
    const result = await prisma.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'user_profiles' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'user_profiles_id_fkey'
    `;
    
    if (result.length > 0) {
      console.log('Dropping foreign key constraint: user_profiles_id_fkey');
      await prisma.$executeRaw`
        ALTER TABLE user_profiles 
        DROP CONSTRAINT IF EXISTS user_profiles_id_fkey
      `;
      console.log('✅ Foreign key constraint dropped successfully');
    } else {
      console.log('No foreign key constraint found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserProfilesForeignKey();
