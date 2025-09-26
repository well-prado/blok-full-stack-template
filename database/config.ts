import * as schema from './schemas';

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import path from 'path';

// Database file path - will be created in database/ folder
const dbPath = path.join(__dirname, 'app.db');

// Create LibSQL client
const client = createClient({
  url: `file:${dbPath}`,
});

// Create Drizzle database instance
export const db = drizzle(client, { schema });

// Export the raw client for direct queries if needed
export const rawClient = client;

// Database configuration
export const dbConfig = {
  path: dbPath,
  mode: 'WAL',
  timeout: 5000,
};

// Helper function to close database connection
export const closeDb = () => {
  client.close();
};

export default db;
