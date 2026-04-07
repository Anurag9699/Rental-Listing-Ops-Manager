import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// A pool of beautiful property images from Unsplash
const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1e52db06ac?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1600&q=80',
  'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80',
];

function getImages(count = 5, offset = 0): string[] {
  return Array.from({ length: count }, (_, i) => IMAGE_POOL[(offset + i) % IMAGE_POOL.length]);
}

async function main() {
  const listings = await prisma.listing.findMany();
  console.log(`Found ${listings.length} listings. Updating images...`);

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const images = getImages(5, i * 3); // offset so each listing gets different images
    await prisma.listing.update({
      where: { id: listing.id },
      data: { imageUrls: images },
    });
    console.log(`✅ Updated: ${listing.title} (${listing.id})`);
  }

  console.log('\nAll listings updated with images!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
