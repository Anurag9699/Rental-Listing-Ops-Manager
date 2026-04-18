import "dotenv/config";
import { prisma } from './src/prismaClient';
import bcrypt from 'bcryptjs';

async function main() {
  if (!prisma) {
    console.log("No prisma");
    return;
  }
  const SALT_ROUNDS = 10;
  const mockUsers = [
      { id: 'admin-1', name: 'Ops Admin',     email: 'admin@rentalops.com', password: bcrypt.hashSync('admin123', SALT_ROUNDS), role: 'ADMIN' },
      { id: 'mid-1',   name: 'Rahul Sharma',  email: 'rahul@rentalops.com', password: bcrypt.hashSync('rahul123', SALT_ROUNDS), role: 'MIDDLEMAN' },
      { id: 'mid-2',   name: 'Priya Patel',   email: 'priya@rentalops.com', password: bcrypt.hashSync('priya123', SALT_ROUNDS), role: 'MIDDLEMAN' },
      { id: 'cust-1',  name: 'Alex Johnson',  email: 'alex@gmail.com',      password: bcrypt.hashSync('alex123',  SALT_ROUNDS), role: 'CUSTOMER' },
      { id: 'cust-2',  name: 'Sara Williams', email: 'sara@gmail.com',      password: bcrypt.hashSync('sara123',  SALT_ROUNDS), role: 'CUSTOMER' },
  ];

  for (const u of mockUsers) {
    try {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role as any
        }
      });
      console.log('Upserted user:', u.email);
    } catch (e) {
      console.error(e);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
