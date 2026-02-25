import express from 'express';
import cors from 'cors';

import listingRoutes from './routes/listings';
import availabilityRoutes from './routes/availability';
import chatRoutes from './routes/chat';

const app = express();

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

// API Routes
app.use('/api/listings', listingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/chat', chatRoutes);

export default app;
