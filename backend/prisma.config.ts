import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const rootEnv = resolve(__dirname, '../.env');

if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
