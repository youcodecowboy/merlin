import type { Config } from 'drizzle-kit'

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: 'postgresql://postgres.adhaigfqpqcaatinxoah:b3Zkgesy2p7QxE9O@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
  },
  verbose: true,
  strict: true,
} satisfies Config