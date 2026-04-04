import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // 0. Create an owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@test.com' },
    update: {},
    create: {
      id: 'test-owner-id',
      name: 'Test Owner',
      email: 'owner@test.com',
      password: 'password',
      role: 'MIDDLEMAN',
    },
  });

  // 1. Create multiple listings
  const baseImages = [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1e52db06ac?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80'
  ];

  const listingData = [
    {
      id: 'mumbai-luxury-1',
      title: 'Ocean Breeze Penthouse',
      city: 'Mumbai',
      address: 'Marine Drive, Mumbai',
      latitude: 18.9440,
      longitude: 72.8230,
      category: 'LUXURY',
      status: 'ACTIVE',
      imageUrls: baseImages
    },
    {
      id: 'mumbai-urban-1',
      title: 'Bandra Business Studio',
      city: 'Mumbai',
      address: 'Pali Hill, Bandra West',
      latitude: 19.0600,
      longitude: 72.8290,
      category: 'URBAN',
      status: 'ACTIVE',
      imageUrls: baseImages
    },
    {
      id: 'delhi-urban-1',
      title: 'Connaught Place Heritage Stay',
      city: 'Delhi',
      address: 'Block B, CP, New Delhi',
      latitude: 28.6315,
      longitude: 77.2167,
      category: 'URBAN',
      status: 'ACTIVE',
      imageUrls: baseImages
    },
    {
      id: 'bangalore-park-1',
      title: 'Garden City Luxury Suite',
      city: 'Bangalore',
      address: 'Indiranagar, Bangalore',
      latitude: 12.9716,
      longitude: 77.5946,
      category: 'LUXURY',
      status: 'ACTIVE',
      imageUrls: baseImages
    },
    {
      id: 'manali-resort-1',
      title: 'Snow Peak Chalet',
      city: 'Manali',
      address: 'Old Manali, Himachal',
      latitude: 32.2432,
      longitude: 77.1892,
      category: 'WATERFRONT', // Using waterfront for proximity to river/mountain views
      status: 'ACTIVE',
      imageUrls: baseImages
    }
  ];

  for (const l of listingData) {
    await prisma.listing.upsert({
      where: { id: l.id },
      update: {},
      create: {
        ...l,
        ownerId: owner.id,
        category: l.category as any,
        status: l.status as any
      },
    });
    console.log(`Created/Updated Listing: ${l.title}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
