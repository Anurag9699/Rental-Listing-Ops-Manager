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
        const listing = await prisma.listing.create({
            data: {
                title: "Array test",
                ownerId: "mid-1",
                imageUrls: ["https://picsum.photos/200"]
            }
        });
        console.log("Success:", listing);
    } catch (e: any) {
        console.error("PRISMA ERROR IS:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
