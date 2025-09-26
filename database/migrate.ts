import { closeDb, db } from './config';

import { migrate } from 'drizzle-orm/libsql/migrator';

async function runMigrations() {
  try {
    await migrate(db, { migrationsFolder: './migrations' });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    closeDb();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
