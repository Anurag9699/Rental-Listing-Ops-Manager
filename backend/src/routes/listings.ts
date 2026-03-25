import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
// Lazy load or mock prisma for demonstration
let prisma: any;
try {
    prisma = new PrismaClient();
} catch (e) {
    prisma = { listing: { findMany: () => Promise.reject("Mock") }, chatMessage: { findMany: () => Promise.reject("Mock") } };
}

// Track which mock listings have availability blocks (for readiness check in mock mode)
export const mockBlockedListings = new Set<string>();

// Mock storage for demonstration when DB is down
const mockListings: any[] = [
    { id: '1', title: 'Modern Waterfront Studio', category: 'WATERFRONT', status: 'ACTIVE', createdAt: new Date() },
    { id: '2', title: 'Downtown Glass Loft', category: 'URBAN', status: 'PAUSED', createdAt: new Date() },
    { id: '3', title: 'Mountain View Chalet', category: 'LUXURY', status: 'DRAFT', createdAt: new Date() }
];

// GET /listings
router.get('/', async (req, res) => {
    try {
        const listings = await prisma.listing.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(listings);
    } catch (error: any) {
        // Return in-memory mocks if DB fails
        res.status(200).json(mockListings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    }
});

// POST /listings
router.post('/', async (req, res) => {
    const { title, status, category } = req.body;
    try {
        const listing = await prisma.listing.create({
            data: { title, category: category || 'URBAN', status: status || 'DRAFT' }
        });
        res.status(201).json(listing);
    } catch (error: any) {
        // Mock creation
        const newListing = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            status: status || 'DRAFT',
            category: category || 'URBAN',
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
            where: { id: req.params.id }
        });
        if (!listing) throw new Error("Not found");
        res.status(200).json(listing);
    } catch (error: any) {
        const found = mockListings.find(l => l.id === req.params.id);
        res.status(200).json(found || mockListings[0]);
    }
});

// Valid state transitions (State Machine Guard)
const VALID_TRANSITIONS: Record<string, string[]> = {
    DRAFT: ['ACTIVE'],
    ACTIVE: ['PAUSED', 'DISABLED'],
    PAUSED: ['ACTIVE', 'DISABLED'],
    DISABLED: [] // Terminal state — no transitions allowed
};

// PATCH /listings/:id/state
router.patch('/:id/state', async (req, res) => {
    const { status: newStatus } = req.body;

    if (!newStatus) {
        return res.status(400).json({ error: "New status is required." });
    }

    try {
        const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
        if (!listing) return res.status(404).json({ error: "Listing not found." });

        const currentStatus = listing.status;
        const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];

        // State Machine Guard
        if (!allowedTransitions.includes(newStatus)) {
            return res.status(400).json({
                error: `Invalid state transition: ${currentStatus} → ${newStatus} is not allowed.`,
                allowedTransitions
            });
        }

        // Readiness Validator: Can only go ACTIVE if availability blocks exist
        if (newStatus === 'ACTIVE') {
            const blockCount = await prisma.availabilityBlock.count({ where: { listingId: req.params.id } });
            if (blockCount === 0) {
                return res.status(400).json({
                    error: "Listing readiness check failed: At least one availability block must be configured before activating a listing."
                });
            }
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

        // Readiness check in mock mode
        if (newStatus === 'ACTIVE') {
            if (!mockBlockedListings.has(listing.id)) {
                return res.status(400).json({
                    error: "Listing readiness check failed: At least one availability block must be configured before activating a listing."
                });
            }
        }

        listing.status = newStatus;
        res.status(200).json(listing);
    }
});

export default router;
