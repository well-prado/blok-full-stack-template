import { closeDb, db, dbConfig } from './config';

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('🔄 Running Prisma migrations...');
  try {
    // Ensure the database directory exists
    const dbDir = path.dirname(dbConfig.path);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Run Prisma migrations
    execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    console.log('✅ Prisma migrations completed');
    await db.$connect(); // Connect after migrations
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Prisma migration failed:', error);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
