import { Router } from 'express';

const router = Router();

// POST /availability/block
router.post('/block', (req, res) => {
    res.status(201).json({ message: 'Create availability block placeholder' });
});

// GET /availability/:listingId
router.get('/:listingId', (req, res) => {
    res.status(200).json({ message: `Get availability for listing ${req.params.listingId} placeholder` });
});

// POST /availability/validate
router.post('/validate', (req, res) => {
    res.status(200).json({ message: 'Validate availability placeholder' });
});

export default router;
