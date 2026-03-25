import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

// In-memory store for demonstration fallback
const mockMessages: any[] = [
    { id: 'm1', listingId: '1', senderRole: 'OPERATOR', messageText: 'Hello! I am your Rental Operations manager. How can I help you today?', createdAt: new Date() },
    { id: 'm2', listingId: '1', senderRole: 'CUSTOMER', messageText: 'Hi, is this waterfront studio available for April dates?', createdAt: new Date() }
];

let prisma: any;
try {
    prisma = new PrismaClient();
} catch (e) {
    prisma = { 
        chatMessage: { 
            findMany: () => Promise.reject("Mock"),
            create: () => Promise.reject("Mock")
        } 
    };
}

// POST /chat/message
router.post('/message', async (req, res) => {
    const { listingId, senderRole, messageText } = req.body;
    try {
        const message = await prisma.chatMessage.create({
            data: {
                listingId,
                senderRole,
                messageText
            }
        });
        res.status(201).json(message);
    } catch (error: any) {
        // Mock fallback for demonstration interactivity
        const newMessage = {
            id: 'mock-m-' + Date.now(),
            listingId,
            senderRole,
            messageText,
            createdAt: new Date()
        };
        mockMessages.push(newMessage);
        res.status(201).json(newMessage);
    }
});

// GET /chat/:listingId
router.get('/:listingId', async (req, res) => {
    try {
        const messages = await prisma.chatMessage.findMany({
            where: { listingId: req.params.listingId },
            orderBy: { createdAt: 'asc' }
        });
        if (messages.length === 0) throw new Error("No chat");
        res.status(200).json(messages);
    } catch (error: any) {
        // Return in-memory mock data
        const filtered = mockMessages.filter(m => m.listingId === req.params.listingId);
        res.status(200).json(filtered.length > 0 ? filtered : [
            { id: 'm1', listingId: req.params.listingId, senderRole: 'OPERATOR', messageText: 'Hello! I am your Rental Operations manager. How can I help you today?', createdAt: new Date() },
            { id: 'm2', listingId: req.params.listingId, senderRole: 'CUSTOMER', messageText: 'Hi, is this waterfront studio available for April dates?', createdAt: new Date() }
        ]);
    }
});

export default router;
