import { Module, Global, OnModuleInit, Inject } from '@nestjs/common';
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
export class DatabaseModule implements OnModuleInit {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async onModuleInit() {
    try {
      await this.pool.query(`
        ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'local';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      `);
      console.log('Database schema verified: OAuth columns ready');
    } catch (err: any) {
      console.warn('Schema migration check warning:', err.message);
    }
  }
}
