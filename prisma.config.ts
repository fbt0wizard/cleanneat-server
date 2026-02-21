import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Only load .env if DATABASE_URL is not already set (e.g., by tests)
if (!process.env.DATABASE_URL) {
  dotenv.config();
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
