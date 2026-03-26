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

// In-memory mock messages
const mockMessages: any[] = [
    { id: 'm1', listingId: '1', senderId: 'cust-1', senderRole: 'CUSTOMER', messageText: 'Hi, is this waterfront studio available for April dates?', createdAt: new Date() },
    { id: 'm2', listingId: '1', senderId: 'mid-1', senderRole: 'MIDDLEMAN', messageText: 'Hello! Yes, we have availability starting from April 5th. Would you like to schedule a viewing?', createdAt: new Date() },
];

// POST /chat/message — Send message (Customer ↔ Middleman)
router.post('/message', async (req, res) => {
    const { listingId, senderId, senderRole, messageText } = req.body;

    if (!listingId || !senderId || !senderRole || !messageText) {
        return res.status(400).json({ error: "listingId, senderId, senderRole, and messageText are required." });
    }

    const validRoles = ['CUSTOMER', 'MIDDLEMAN'];
    if (!validRoles.includes(senderRole)) {
        return res.status(400).json({ error: "senderRole must be CUSTOMER or MIDDLEMAN." });
    }

    try {
        const message = await prisma.chatMessage.create({
            data: { listingId, senderId, senderRole, messageText }
        });
        res.status(201).json(message);
    } catch (error: any) {
        const newMessage = {
            id: 'msg-' + Date.now(),
            listingId, senderId, senderRole, messageText,
            createdAt: new Date()
        };
        mockMessages.push(newMessage);
        res.status(201).json(newMessage);
    }
});

// GET /chat/:listingId — Get chat history for a listing
router.get('/:listingId', async (req, res) => {
    try {
        const messages = await prisma.chatMessage.findMany({
            where: { listingId: req.params.listingId },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true, role: true } } }
        });
        res.status(200).json(messages.length > 0 ? messages : []);
    } catch (error: any) {
        const filtered = mockMessages.filter(m => m.listingId === req.params.listingId);
        res.status(200).json(filtered);
    }
});

export default router;
