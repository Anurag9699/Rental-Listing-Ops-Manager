import { Router } from 'express';

const router = Router();

// POST /listings
router.post('/', (req, res) => {
    res.status(201).json({ message: 'Create listing placeholder' });
});

// GET /listings/:id
router.get('/:id', (req, res) => {
    res.status(200).json({ message: `Get listing ${req.params.id} placeholder` });
});

// PATCH /listings/:id/state
router.patch('/:id/state', (req, res) => {
    res.status(200).json({ message: `Update listing ${req.params.id} state placeholder` });
});

export default router;
