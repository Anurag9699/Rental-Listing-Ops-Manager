import "dotenv/config";
import { Router } from 'express';
import { prisma } from '../prismaClient';
import axios from 'axios';

const router = Router();
const AVAILABILITY_ENGINE_URL = process.env.AVAILABILITY_ENGINE_URL || 'http://localhost:3002/api/availability';

// In-memory mock bookings (used only when DB is unavailable)
const mockBookings: any[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT: /user/:customerId MUST be declared BEFORE /:listingId
// otherwise Express will match "user" as listingId and shadow this route.
// ─────────────────────────────────────────────────────────────────────────────

// GET /bookings/user/:customerId — Get all bookings for a customer
router.get('/user/:customerId', async (req, res) => {
    try {
        if (!prisma) throw new Error('DB unavailable');
        const bookings = await prisma.bookingRequest.findMany({
            where: { customerId: req.params.customerId },
            orderBy: { createdAt: 'desc' },
            include: { listing: { select: { id: true, title: true, category: true } } }
        });
        res.status(200).json(bookings);
    } catch (error: any) {
        const filtered = mockBookings.filter(b => b.customerId === req.params.customerId);
        res.status(200).json(filtered);
    }
});

// POST /bookings — Customer creates a booking (instant confirmation)
router.post('/', async (req, res) => {
    const { listingId, customerId, startDate, endDate } = req.body;

    if (!listingId || !customerId || !startDate || !endDate) {
        return res.status(400).json({ error: "listingId, customerId, startDate, and endDate are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid date format. Please provide valid ISO date strings." });
    }

    if (start >= end) {
        return res.status(400).json({ error: "startDate must be before endDate." });
    }

    // Validate start date is not in the past (compare date only, not time)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (start < todayStart) {
        return res.status(400).json({ error: "startDate cannot be in the past." });
    }

    try {
        if (!prisma) throw new Error('DB unavailable');

        // 1. Request the Availability Engine to atomically check & block dates
        //    This is the single source of truth for double-booking prevention.
        try {
            await axios.post(`${AVAILABILITY_ENGINE_URL}/block`, {
                listingId,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                blockReason: `Booking by customer ${customerId}`
            });
        } catch (blockError: any) {
            // Propagate 409 Conflict and 400 Bad Request from availability engine
            if (blockError.response?.status === 409) {
                return res.status(409).json({ error: blockError.response.data?.error || "These dates are already booked. Please choose different dates." });
            }
            if (blockError.response?.status === 400) {
                return res.status(400).json({ error: blockError.response.data?.error || "Invalid booking dates." });
            }
            // Availability engine is down — proceed with DB-only booking (best effort)
            console.warn('[Bookings] ⚠️ Availability engine unreachable, proceeding without date block.');
        }

        // 2. Save the Booking as CONFIRMED in DB
        const booking = await prisma.bookingRequest.create({
            data: {
                listingId, customerId,
                startDate: start, endDate: end,
                status: 'CONFIRMED'
            }
        });
        res.status(201).json(booking);

    } catch (error: any) {
        // Handle Availability Engine rejection that bubbled up early (should not reach here normally)
        if (error.response?.status === 409 || error.response?.status === 400) {
            return res.status(error.response.status).json({ error: error.response.data?.error || "Dates are no longer available." });
        }

        // ── Mock Fallback (DB unavailable) ──────────────────────────────────
        // Check for double-booking in mock data before inserting
        const conflict = mockBookings.find(b =>
            b.listingId === listingId &&
            b.status === 'CONFIRMED' &&
            new Date(b.startDate) < end &&
            new Date(b.endDate) > start
        );
        if (conflict) {
            return res.status(409).json({
                error: `These dates are already booked (${new Date(conflict.startDate).toLocaleDateString()} – ${new Date(conflict.endDate).toLocaleDateString()}). Please choose different dates.`
            });
        }

        const newBooking = {
            id: 'bk-' + Date.now(),
            listingId, customerId,
            startDate: start, endDate: end,
            status: 'CONFIRMED',
            createdAt: new Date()
        };
        mockBookings.push(newBooking);
        res.status(201).json(newBooking);
    }
});

// GET /bookings/:listingId — Get all booking requests for a listing (sorted FIFO)
router.get('/:listingId', async (req, res) => {
    try {
        if (!prisma) throw new Error('DB unavailable');
        const bookings = await prisma.bookingRequest.findMany({
            where: { listingId: req.params.listingId },
            orderBy: { createdAt: 'asc' },
            include: { customer: { select: { id: true, name: true, email: true } } }
        });
        res.status(200).json(bookings);
    } catch (error: any) {
        const filtered = mockBookings
            .filter(b => b.listingId === req.params.listingId)
            .sort((a, b) => a.createdAt - b.createdAt);
        res.status(200).json(filtered);
    }
});

// PATCH /bookings/:id/confirm — Middleman confirms → auto-blocks dates
router.patch('/:id/confirm', async (req, res) => {
    try {
        if (!prisma) throw new Error('DB unavailable');
        const booking = await prisma.bookingRequest.findUnique({ where: { id: req.params.id } });
        if (!booking) return res.status(404).json({ error: "Booking not found." });
        if (booking.status !== 'PENDING') {
            return res.status(400).json({ error: `Cannot confirm a booking with status: ${booking.status}` });
        }

        // Auto-block dates via Availability Engine
        try {
            await axios.post(`${AVAILABILITY_ENGINE_URL}/block`, {
                listingId: booking.listingId,
                startDate: booking.startDate.toISOString(),
                endDate: booking.endDate.toISOString(),
                blockReason: `Booking confirmed for customer ${booking.customerId}`
            });
        } catch (blockError: any) {
            if (blockError.response?.status === 409) {
                // Dates already taken — reject this booking
                await prisma.bookingRequest.update({
                    where: { id: req.params.id },
                    data: { status: 'REJECTED' }
                });
                return res.status(409).json({ error: "Dates already blocked. Booking auto-rejected.", booking: { ...booking, status: 'REJECTED' } });
            }
            throw blockError;
        }

        const updated = await prisma.bookingRequest.update({
            where: { id: req.params.id },
            data: { status: 'CONFIRMED' }
        });
        res.status(200).json(updated);
    } catch (error: any) {
        // Mock fallback
        const booking = mockBookings.find(b => b.id === req.params.id);
        if (!booking) return res.status(404).json({ error: "Booking not found." });
        booking.status = 'CONFIRMED';
        res.status(200).json(booking);
    }
});

// PATCH /bookings/:id/reject — Middleman rejects
router.patch('/:id/reject', async (req, res) => {
    try {
        if (!prisma) throw new Error('DB unavailable');
        const booking = await prisma.bookingRequest.findUnique({ where: { id: req.params.id } });
        if (!booking) return res.status(404).json({ error: "Booking not found." });
        if (booking.status !== 'PENDING') {
            return res.status(400).json({ error: `Cannot reject a booking with status: ${booking.status}` });
        }
        const updated = await prisma.bookingRequest.update({
            where: { id: req.params.id },
            data: { status: 'REJECTED' }
        });
        res.status(200).json(updated);
    } catch (error: any) {
        const booking = mockBookings.find(b => b.id === req.params.id);
        if (!booking) return res.status(404).json({ error: "Booking not found." });
        booking.status = 'REJECTED';
        res.status(200).json(booking);
    }
});

export default router;
