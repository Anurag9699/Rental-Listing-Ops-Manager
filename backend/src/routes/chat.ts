import "dotenv/config";
import { Router } from 'express';
import { getPrisma } from '../prismaClient';
import { sharedMockStore, MockMessage } from '../sharedStore';

const router = Router();

// POST /chat/message — Send message in a specific customer thread
router.post('/message', async (req, res) => {
    const { listingId, customerId, senderId, senderRole, messageText } = req.body;

    if (!listingId || !customerId || !senderId || !senderRole || !messageText) {
        return res.status(400).json({ error: "listingId, customerId, senderId, senderRole, and messageText are required." });
    }

    const validRoles = ['CUSTOMER', 'MIDDLEMAN'];
    if (!validRoles.includes(senderRole)) {
        return res.status(400).json({ error: "senderRole must be CUSTOMER or MIDDLEMAN." });
    }

    try {
        const p = getPrisma();
        if (!p) throw new Error('DB unavailable');
        const message = await p.chatMessage.create({
            data: { listingId, customerId, senderId, senderRole, messageText }
        });
        res.status(201).json(message);
    } catch (error: any) {
        const newMessage: MockMessage = {
            id: 'msg-' + Date.now(),
            listingId, customerId, senderId, senderRole: senderRole as any, messageText,
            createdAt: new Date()
        };
        sharedMockStore.mockMessages.push(newMessage);
        res.status(201).json(newMessage);
    }
});

// GET /chat/:listingId/threads — Get all customer threads for a listing
router.get('/:listingId/threads', async (req, res) => {
    try {
        const p = getPrisma();
        if (!p) throw new Error('DB unavailable');
        // Fetch distinct customers who have messaged in this listing
        const messages = await p.chatMessage.findMany({
            where: { listingId: req.params.listingId },
            select: { customerId: true, customer: { select: { id: true, name: true, email: true } } },
            distinct: ['customerId']
        });
        const customers = messages.map(m => m.customer).filter(Boolean);
        res.status(200).json(customers);
    } catch (error: any) {
        // Mock fallback
        const listingMsgs = sharedMockStore.mockMessages.filter(m => m.listingId === req.params.listingId);
        const customersMap = new Map();
        listingMsgs.forEach(m => {
            if (!customersMap.has(m.customerId)) {
                // Try to find real name in shared store
                const realUser = sharedMockStore.findUserById(m.customerId);
                customersMap.set(m.customerId, { 
                    id: m.customerId, 
                    name: realUser ? realUser.name : 'Unknown Customer', 
                    email: realUser ? realUser.email : 'unknown@example.com' 
                });
            }
        });
        res.status(200).json(Array.from(customersMap.values()));
    }
});

// GET /chat/:listingId — Get chat history for a specific customer thread
// Requires ?customerId=xxx
router.get('/:listingId', async (req, res) => {
    const { customerId } = req.query;
    
    if (!customerId) {
        return res.status(400).json({ error: "customerId query parameter is required to view a chat thread." });
    }

    try {
        const p = getPrisma();
        if (!p) throw new Error('DB unavailable');
        const messages = await p.chatMessage.findMany({
            where: { listingId: req.params.listingId, customerId: customerId as string },
            orderBy: { createdAt: 'asc' },
            include: { sender: { select: { id: true, name: true, role: true } } }
        });
        res.status(200).json(messages.length > 0 ? messages : []);
    } catch (error: any) {
        const filtered = sharedMockStore.mockMessages.filter(m => 
            m.listingId === req.params.listingId && 
            m.customerId === customerId
        );
        res.status(200).json(filtered);
    }
});

export default router;
