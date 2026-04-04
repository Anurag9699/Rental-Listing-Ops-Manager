import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prismaInstance: PrismaClient | null = null;

const connectionString = process.env.DATABASE_URL;
console.log('[DB] DATABASE_URL present:', !!connectionString);

try {
    if (!connectionString) throw new Error('DATABASE_URL env var not set');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prismaInstance = new PrismaClient({ adapter } as any);
    console.log('[DB] ✅ PostgreSQL connected via PrismaPg adapter');
} catch (e: any) {
    console.error('[DB] ❌ Connection error:', e.message);
    console.error('[DB] Stack:', e.stack);
    prismaInstance = null;
}

export const prisma = prismaInstance;
