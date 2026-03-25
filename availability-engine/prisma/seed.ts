import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 1. Create a listing
  const listing = await prisma.listing.upsert({
    where: { id: 'test-listing-id' },
    update: {},
    create: {
      id: 'test-listing-id',
      title: 'Luxury Villa in Malibu',
      status: 'ACTIVE',
    },
  });

  console.log(`Created Listing: ${listing.title} (${listing.id})`);

  // 2. Create some availability blocks
  await prisma.availabilityBlock.createMany({
    data: [
      {
        listingId: listing.id,
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-04-05'),
        blockReason: 'Maintenance',
      },
      {
        listingId: listing.id,
        startDate: new Date('2024-04-15'),
        endDate: new Date('2024-04-20'),
        blockReason: 'Owner Stay',
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
