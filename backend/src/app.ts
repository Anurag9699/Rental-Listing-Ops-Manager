import express from 'express';
import cors from 'cors';

import listingRoutes from './routes/listings';
import chatRoutes from './routes/chat';

const app = express();

app.use(cors());
app.use(express.json());

// Enhanced health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'backend',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/listings', listingRoutes);
app.use('/api/chat', chatRoutes);

export default app;
