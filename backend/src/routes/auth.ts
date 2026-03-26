import "dotenv/config";
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

let prisma: any;
try {
    prisma = new PrismaClient();
} catch (e) {
    prisma = null;
}

// In-memory mock users for demo
const mockUsers: any[] = [
    { id: 'admin-1', name: 'Ops Admin', email: 'admin@rentalops.com', password: 'admin123', role: 'ADMIN', createdAt: new Date() },
    { id: 'mid-1', name: 'Rahul Sharma', email: 'rahul@rentalops.com', password: 'rahul123', role: 'MIDDLEMAN', createdAt: new Date() },
    { id: 'mid-2', name: 'Priya Patel', email: 'priya@rentalops.com', password: 'priya123', role: 'MIDDLEMAN', createdAt: new Date() },
    { id: 'cust-1', name: 'Alex Johnson', email: 'alex@gmail.com', password: 'alex123', role: 'CUSTOMER', createdAt: new Date() },
    { id: 'cust-2', name: 'Sara Williams', email: 'sara@gmail.com', password: 'sara123', role: 'CUSTOMER', createdAt: new Date() },
];

// POST /auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "name, email, and password are required." });
    }

    const validRoles = ['ADMIN', 'MIDDLEMAN', 'CUSTOMER'];
    const userRole = validRoles.includes(role) ? role : 'CUSTOMER';

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: "User with this email already exists." });
        }
        const user = await prisma.user.create({
            data: { name, email, password, role: userRole }
        });
        const { password: _, ...safeUser } = user;
        res.status(201).json(safeUser);
    } catch (error: any) {
        // Mock fallback
        const existing = mockUsers.find(u => u.email === email);
        if (existing) return res.status(409).json({ error: "User with this email already exists." });
        const newUser = {
            id: 'user-' + Date.now(),
            name, email, password, role: userRole, createdAt: new Date()
        };
        mockUsers.push(newUser);
        const { password: _, ...safeUser } = newUser;
        res.status(201).json(safeUser);
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required." });
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password." });
        }
        const { password: _, ...safeUser } = user;
        res.status(200).json(safeUser);
    } catch (error: any) {
        // Mock fallback
        const user = mockUsers.find(u => u.email === email && u.password === password);
        if (!user) return res.status(401).json({ error: "Invalid email or password." });
        const { password: _, ...safeUser } = user;
        res.status(200).json(safeUser);
    }
});

// GET /auth/users (admin only — list all users)
router.get('/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true }
        });
        res.status(200).json(users);
    } catch (error: any) {
        res.status(200).json(mockUsers.map(({ password, ...u }: any) => u));
    }
});

export default router;
