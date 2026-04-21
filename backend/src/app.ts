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

// Base route for the browser
app.get('/', (req, res) => {
    res.status(200).send(`
        <html>
            <head><title>Rental Ops API</title></head>
            <body style="font-family: system-ui, sans-serif; padding: 2rem; text-align: center; background: #f8fafc;">
                <h1 style="color: #0f172a;">Rental Listing Ops Manager API</h1>
                <p style="color: #475569;">The backend service is running successfully.</p>
                <div style="margin-top: 2rem; padding: 1rem; background: #e2e8f0; border-radius: 8px; display: inline-block;">
                    Status: <strong>UP</strong>
                </div>
            </body>
        </html>
    `);
});

// Mock Availability Route to suppress connection errors if microservice is offline
app.get('/api/availability/:listingId', (req, res) => {
    res.status(200).json([]);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);

export default app;
