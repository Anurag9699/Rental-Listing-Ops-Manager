import express from 'express';
import cors from 'cors';

import availabilityRoutes from './availability';

const app = express();

app.use(cors());
app.use(express.json());

// Enhanced health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'UP', 
        service: 'availability-engine',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/availability', availabilityRoutes);

export default app;
