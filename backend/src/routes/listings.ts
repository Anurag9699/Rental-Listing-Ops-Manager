import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
let prisma: any;
try {
    prisma = new PrismaClient();
} catch (e) {
    prisma = null;
}

// Mock storage
const mockListings: any[] = [
    { id: '1', title: 'Modern Waterfront Studio', category: 'WATERFRONT', status: 'ACTIVE', ownerId: 'mid-1', createdAt: new Date() },
    { id: '2', title: 'Downtown Glass Loft', category: 'URBAN', status: 'PENDING_APPROVAL', ownerId: 'mid-1', createdAt: new Date() },
    { id: '3', title: 'Mountain View Chalet', category: 'LUXURY', status: 'DRAFT', ownerId: 'mid-2', createdAt: new Date() },
    { id: '4', title: 'Suburban Family Home', category: 'ECONOMY', status: 'ACTIVE', ownerId: 'mid-2', createdAt: new Date() },
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

// GET /listings — role-filtered
// Query params: ?role=ADMIN|MIDDLEMAN|CUSTOMER&ownerId=xxx
router.get('/', async (req, res) => {
    const { role, ownerId } = req.query;

    try {
        let where: any = {};
        if (role === 'CUSTOMER') {
            where.status = 'ACTIVE'; // Customers only see approved listings
        } else if (role === 'MIDDLEMAN' && ownerId) {
            where.ownerId = ownerId; // Middlemen see only their own
        }
        // ADMIN sees all

        const listings = await prisma.listing.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: { owner: { select: { id: true, name: true, email: true } } }
        });
        res.status(200).json(listings);
    } catch (error: any) {
        let filtered = [...mockListings];
        if (role === 'CUSTOMER') {
            filtered = filtered.filter(l => l.status === 'ACTIVE');
        } else if (role === 'MIDDLEMAN' && ownerId) {
            filtered = filtered.filter(l => l.ownerId === ownerId);
        }
        res.status(200).json(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    }
});

// POST /listings — Middleman creates a listing (starts as DRAFT)
router.post('/', async (req, res) => {
    const { title, description, category, ownerId } = req.body;

    if (!title || !ownerId) {
        return res.status(400).json({ error: "title and ownerId are required." });
    }

    try {
        const listing = await prisma.listing.create({
            data: {
                title,
                description: description || null,
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
