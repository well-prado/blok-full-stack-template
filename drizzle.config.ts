import type { Config } from 'drizzle-kit';

export default {
  schema: './database/schemas/*',
  out: './database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: './database/app.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
