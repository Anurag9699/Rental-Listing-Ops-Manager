import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let _prisma: PrismaClient | null = null;
let _isInitializing = false;

export const getPrisma = (): PrismaClient | null => {
    if (_prisma) return _prisma;
    if (_isInitializing) return null;

    _isInitializing = true;
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
        console.warn('[DB] ⚠️ DATABASE_URL not found. Running in Mock fallback mode.');
        _isInitializing = false;
        return null;
    }

    try {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaPg(pool);
        _prisma = new PrismaClient({ adapter } as any);
        console.log('[DB] ✅ PostgreSQL connected via PrismaPg adapter');
        _isInitializing = false;
        return _prisma;
    } catch (e: any) {
        console.error('[DB] ❌ Failed to connect:', e.message);
        _isInitializing = false;
        return null;
    }
};

// Exporting a getter-like proxy to maintain compatibility with existing imports
export const prisma = new Proxy({} as PrismaClient, {
    get: (target, prop) => {
        const instance = getPrisma();
        if (!instance) {
            // If someone tries to use it while it's null, we'll throw a clean error
            // that the routes can catch to trigger their mock fallbacks.
            throw new Error('Database is currently offline.');
        }
        return (instance as any)[prop];
    }
});
