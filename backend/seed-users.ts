import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const mockUsers = [
    { id: 'admin-1', name: 'Ops Admin', email: 'admin@rentalops.com', password: 'admin123', role: 'ADMIN' },
    { id: 'mid-1', name: 'Rahul Sharma', email: 'rahul@rentalops.com', password: 'rahul123', role: 'MIDDLEMAN' },
    { id: 'mid-2', name: 'Priya Patel', email: 'priya@rentalops.com', password: 'priya123', role: 'MIDDLEMAN' },
    { id: 'cust-1', name: 'Alex Johnson', email: 'alex@gmail.com', password: 'alex123', role: 'CUSTOMER' },
    { id: 'cust-2', name: 'Sara Williams', email: 'sara@gmail.com', password: 'sara123', role: 'CUSTOMER' },
];

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter } as any);
    
    try {
        for (const u of mockUsers) {
            await prisma.user.upsert({
                where: { email: u.email },
                update: {},
                create: {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    password: u.password,
                    role: u.role as any,
                }
            });
        }
        console.log("Mock users successfully seeded into DB!");
    } catch (e: any) {
        console.error("PRISMA ERROR IS:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
