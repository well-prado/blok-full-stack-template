import { PrismaClient } from './generated/prisma';
import path from 'path';

// Determine the database path dynamically
const dbPath = path.join(__dirname, 'app.db');

// Create Prisma client instance
export const db = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

// Database configuration for migrations and other operations
export const dbConfig = {
  path: dbPath,
};

// Helper function to close database connection
export const closeDb = async () => {
  await db.$disconnect();
};

export default db;
