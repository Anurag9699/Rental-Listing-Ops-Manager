import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// In-memory store for demonstration fallback
const mockBlocks: any[] = [];

let prisma: any = null;
try {
    prisma = new PrismaClient();
    console.log('[Availability] ✅ Prisma client initialized');
} catch (e: any) {
    console.warn('[Availability] ⚠️ Prisma unavailable, using mock data:', e.message);
    prisma = null;
}

// POST /availability/block
router.post('/block', async (req, res) => {
    const { listingId, startDate, endDate, blockReason } = req.body;

    // Edge Case: Validate required fields
    if (!listingId || !startDate || !endDate) {
        return res.status(400).json({ error: "listingId, startDate, and endDate are all required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Edge Case: Reject past dates — compare date-only (midnight) so today is a valid check-in
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    if (start < todayMidnight) {
        return res.status(400).json({ error: "Cannot block dates in the past. startDate must be today or in the future." });
    }

    // Edge Case: Reject invalid date range
    if (start >= end) {
        return res.status(400).json({ error: "Invalid date range: startDate must be strictly before endDate." });
    }

    try {
        if (!prisma) throw new Error('DB_UNAVAILABLE');
        // Concurrency Safety: Use a Prisma $transaction to safely check for conflicts and write atomically
        const block = await prisma.$transaction(async (tx: any) => {
            // Check for overlapping blocks within the transaction
            const overlapping = await tx.availabilityBlock.findMany({
                where: {
                    listingId,
                    OR: [{ startDate: { lte: end }, endDate: { gte: start } }]
                }
            });

            if (overlapping.length > 0) {
                throw new Error(`CONFLICT: These dates overlap with an existing block from ${overlapping[0].startDate} to ${overlapping[0].endDate}.`);
            }

            return tx.availabilityBlock.create({
                data: { listingId, startDate: start, endDate: end, blockReason }
            });
        });
        res.status(201).json(block);
    } catch (error: any) {
        if (error.message && error.message.startsWith('CONFLICT:')) {
            return res.status(409).json({ error: error.message });
        }
        // Mock fallback: also check for overlaps in in-memory blocks
        const overlap = mockBlocks.find(b =>
            b.listingId === listingId &&
            new Date(b.startDate) <= end &&
            new Date(b.endDate) >= start
        );
        if (overlap) {
            return res.status(409).json({ error: `CONFLICT: These dates overlap with an existing block from ${overlap.startDate} to ${overlap.endDate}.` });
        }
        const newBlock = {
            id: 'mock-' + Date.now(),
            listingId,
            startDate: start,
            endDate: end,
            blockReason
        };
        mockBlocks.push(newBlock);
        res.status(201).json(newBlock);
    }
});

// GET /availability/:listingId
router.get('/:listingId', async (req, res) => {
    const { listingId } = req.params;

    try {
        if (!prisma) throw new Error('DB_UNAVAILABLE');
        const blocks = await prisma.availabilityBlock.findMany({
            where: { listingId },
            orderBy: { startDate: 'asc' },
        });
        res.status(200).json(blocks);
    } catch (error: any) {
        // Return in-memory mock data filtered by listingId — empty if none match
        const filtered = mockBlocks.filter(b => b.listingId === listingId);
        res.status(200).json(filtered);
    }
});

// POST /availability/validate
router.post('/validate', async (req, res) => {
    const { listingId, startDate, endDate } = req.body;
    const start = new Date(startDate);
    const end = new Date(endDate);

    try {
        // Find any blocks that overlap with the requested range
        const overlappingBlocks = await prisma.availabilityBlock.findMany({
            where: {
                listingId,
                OR: [
                    {
                        startDate: { lte: end },
                        endDate: { gte: start },
                    },
                ],
            },
        });

        const isValid = overlappingBlocks.length === 0;
        res.status(200).json({ 
            isValid, 
            message: isValid ? 'Dates are available' : 'Dates are overlapping with existing blocks' 
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
