import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';

export const DB_POOL = 'DB_POOL';

@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        const isSsl = process.env.DATABASE_URL?.includes('neon.tech') || process.env.DATABASE_URL?.includes('sslmode=require');
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: isSsl ? { rejectUnauthorized: false } : undefined,
        });
        pool.on('error', (err) => console.error('PostgreSQL pool error:', err));
        return pool;
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule {}
