import express from 'express';
import cors from 'cors';
import './prismaClient'; // Initialize DB connection at startup

import authRoutes from './routes/auth';
import listingRoutes from './routes/listings';
import bookingRoutes from './routes/bookings';
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
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);

export default app;
