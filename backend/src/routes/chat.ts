import { Router } from 'express';

const router = Router();

// POST /chat/message
router.post('/message', (req, res) => {
    res.status(201).json({ message: 'Send chat message placeholder' });
});

// GET /chat/:listingId
router.get('/:listingId', (req, res) => {
    res.status(200).json({ message: `Get chat messages for listing ${req.params.listingId} placeholder` });
});

export default router;
