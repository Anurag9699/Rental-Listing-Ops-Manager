import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const router = Router();

let prisma: any = null;
try {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
        const pool = new Pool({ connectionString: dbUrl });
        const adapter = new PrismaPg(pool);
        prisma = new PrismaClient({ adapter } as any);
        console.log('[Listings] ✅ Connected to PostgreSQL');
    } else {
        console.warn('[Listings] ⚠️  No DATABASE_URL, using mock data');
    }
} catch (e: any) {
    console.error('[Listings] ❌ DB Init Error:', e.message);
    prisma = null;
}

// Mock storage
const mockListings: any[] = [
    { id: '1', title: 'Modern Waterfront Studio', category: 'WATERFRONT', status: 'ACTIVE', ownerId: 'mid-1', createdAt: new Date(), city: 'Mumbai', address: 'Bandra West, Mumbai', latitude: 19.0596, longitude: 72.8295, imageUrls: [
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1e52db06ac?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1600&q=80',
    ]},
    { id: '2', title: 'Downtown Glass Loft', category: 'URBAN', status: 'PENDING_APPROVAL', ownerId: 'mid-1', createdAt: new Date(), city: 'Delhi', address: 'Connaught Place, New Delhi', latitude: 28.6315, longitude: 77.2167, imageUrls: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80',
    ]},
    { id: '3', title: 'Mountain View Chalet', category: 'LUXURY', status: 'DRAFT', ownerId: 'mid-2', createdAt: new Date(), city: 'Manali', address: 'Old Manali, Himachal Pradesh', latitude: 32.2432, longitude: 77.1892, imageUrls: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1556020685-ae41abfc9365?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1615873968403-89e068629265?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80',
    ]},
    { id: '4', title: 'Suburban Family Home', category: 'ECONOMY', status: 'ACTIVE', ownerId: 'mid-2', createdAt: new Date(), city: 'Mumbai', address: 'Andheri East, Mumbai', latitude: 19.1136, longitude: 72.8697, imageUrls: [
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    ]},
];

// Valid state transitions (State Machine Guard)
const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['PENDING_APPROVAL'],
    PENDING_APPROVAL: ['ACTIVE', 'REJECTED'],
    ACTIVE: ['PAUSED', 'DISABLED'],
    PAUSED: ['ACTIVE', 'DISABLED'],
    REJECTED: ['DRAFT'],
    DISABLED: []
};

// Helper: Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// GET /listings — role-filtered & location-search
// Query params: ?role=ADMIN|MIDDLEMAN|CUSTOMER&ownerId=xxx&city=Mumbai&lat=12.3&lng=45.6&radius=50
router.get('/', async (req, res) => {
    const { role, ownerId, city, lat, lng, radius } = req.query;

    try {
        let where: any = {};
        if (role === 'CUSTOMER') {
            where.status = 'ACTIVE'; 
        } else if (role === 'MIDDLEMAN' && ownerId) {
            where.ownerId = ownerId; 
        }

        if (city) {
            where.city = { contains: city as string, mode: 'insensitive' };
        }

        let listings = await prisma.listing.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { owner: { select: { id: true, name: true, email: true } } }
        });

        // Filter by proximity if coords provided
        if (lat && lng) {
            const userLat = parseFloat(lat as string);
            const userLng = parseFloat(lng as string);
            const rad = parseFloat(radius as string) || 50; // default 50km
            
            listings = listings.filter((l: any) => {
                if (l.latitude && l.longitude) {
                    const dist = calculateDistance(userLat, userLng, l.latitude, l.longitude);
                    l.distance = dist; // Add distance property for frontend
                    return dist <= rad;
                }
                return false;
            }).sort((a: any, b: any) => (a.distance || 0) - (b.distance || 0));
        }

        res.status(200).json(listings);
    } catch (error: any) {
        let filtered = [...mockListings];
        if (role === 'CUSTOMER') {
            filtered = filtered.filter(l => l.status === 'ACTIVE');
        } else if (role === 'MIDDLEMAN' && ownerId) {
            filtered = filtered.filter(l => l.ownerId === ownerId);
        }

        if (city) {
            filtered = filtered.filter(l => l.city && l.city.toLowerCase().includes((city as string).toLowerCase()));
        }

        if (lat && lng) {
            const userLat = parseFloat(lat as string);
            const userLng = parseFloat(lng as string);
            const rad = parseFloat(radius as string) || 50;

            filtered = filtered.filter(l => {
                if (l.latitude && l.longitude) {
                    const dist = calculateDistance(userLat, userLng, l.latitude, l.longitude);
                    l.distance = dist;
                    return dist <= rad;
                }
                return false;
            }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        res.status(200).json(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    }
});

// POST /listings — Middleman creates a listing (starts as DRAFT)
router.post('/', async (req, res) => {
    const { title, description, category, ownerId, address, city, latitude, longitude } = req.body;

    if (!title || !ownerId) {
        return res.status(400).json({ error: "title and ownerId are required." });
    }

    try {
        const listing = await prisma.listing.create({
            data: {
                title,
                description: description || null,
                address: address || null,
                city: city || null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                category: category || 'URBAN',
                status: 'DRAFT',
                ownerId
            }
        });
        res.status(201).json(listing);
    } catch (error: any) {
        const newListing = {
            id: 'lst-' + Date.now(),
            title,
            description: description || null,
            address: address || null,
            city: city || null,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            status: 'DRAFT',
            category: category || 'URBAN',
            ownerId,
            createdAt: new Date()
        };
        mockListings.push(newListing);
        res.status(201).json(newListing);
    }
});

// GET /listings/:id
router.get('/:id', async (req, res) => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: req.params.id },
            include: { owner: { select: { id: true, name: true, email: true } } }
        });
        if (!listing) return res.status(404).json({ error: "Listing not found." });
        res.status(200).json(listing);
    } catch (error: any) {
        const found = mockListings.find(l => l.id === req.params.id);
        if (!found) return res.status(404).json({ error: "Listing not found." });
        res.status(200).json(found);
    }
});

// PATCH /listings/:id/state — Role-aware state machine
// Body: { status, role } where role is who is making the change
router.patch('/:id/state', async (req, res) => {
    const { status: newStatus, role } = req.body;

    if (!newStatus) {
        return res.status(400).json({ error: "New status is required." });
    }

    try {
        const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
        if (!listing) return res.status(404).json({ error: "Listing not found." });

        const currentStatus = listing.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

        if (!allowedTransitions.includes(newStatus)) {
            return res.status(400).json({
                error: `Invalid state transition: ${currentStatus} → ${newStatus} is not allowed.`,
                allowedTransitions
            });
        }

        // Role enforcement
        if (newStatus === 'PENDING_APPROVAL' && role !== 'MIDDLEMAN') {
            return res.status(403).json({ error: "Only Middlemen can submit listings for approval." });
        }
        if ((newStatus === 'ACTIVE' || newStatus === 'REJECTED') && currentStatus === 'PENDING_APPROVAL' && role !== 'ADMIN') {
            return res.status(403).json({ error: "Only Admin can approve or reject listings." });
        }

        const updated = await prisma.listing.update({
            where: { id: req.params.id },
            data: { status: newStatus }
        });
        res.status(200).json(updated);
    } catch (error: any) {
        // Mock fallback
        const listing = mockListings.find(l => l.id === req.params.id);
        if (!listing) return res.status(404).json({ error: "Listing not found" });

        const allowedTransitions = VALID_TRANSITIONS[listing.status] || [];
        if (!allowedTransitions.includes(newStatus)) {
            return res.status(400).json({
                error: `Invalid state transition: ${listing.status} → ${newStatus} is not allowed.`,
                allowedTransitions
            });
        }

        listing.status = newStatus;
        res.status(200).json(listing);
    }
});

export default router;
