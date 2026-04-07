import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter } as any);
    
    try {
        const users = await prisma.user.findMany();
        console.log("Users in DB:", users);
    } catch (e: any) {
        console.error("PRISMA ERROR IS:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
