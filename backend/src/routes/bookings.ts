import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const router = Router();
const AVAILABILITY_ENGINE_URL = process.env.AVAILABILITY_ENGINE_URL || 'http://localhost:3002/api/availability';

let prisma: any;
try {
    prisma = new PrismaClient();
} catch (e) {
    prisma = null;
}

// In-memory mock bookings
const mockBookings: any[] = [];

// POST /bookings — Customer creates a booking request (enters the queue)
router.post('/', async (req, res) => {
    const { listingId, customerId, startDate, endDate } = req.body;

    if (!listingId || !customerId || !startDate || !endDate) {
        return res.status(400).json({ error: "listingId, customerId, startDate, and endDate are required." });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
        return res.status(400).json({ error: "startDate must be before endDate." });
    }

    try {
        const booking = await prisma.bookingRequest.create({
            data: {
                listingId, customerId,
                startDate: start, endDate: end,
                status: 'PENDING'
            }
        });
        res.status(201).json(booking);
    } catch (error: any) {
        const newBooking = {
            id: 'bk-' + Date.now(),
            listingId, customerId,
            startDate: start, endDate: end,
            status: 'PENDING',
            createdAt: new Date()
        };
        mockBookings.push(newBooking);
        res.status(201).json(newBooking);
    }
});

// GET /bookings/:listingId — Get all booking requests for a listing (sorted FIFO)
router.get('/:listingId', async (req, res) => {
    try {
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

// GET /bookings/user/:customerId — Get all bookings for a customer
router.get('/user/:customerId', async (req, res) => {
    try {
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

// PATCH /bookings/:id/confirm — Middleman confirms → auto-blocks dates
router.patch('/:id/confirm', async (req, res) => {
    try {
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
