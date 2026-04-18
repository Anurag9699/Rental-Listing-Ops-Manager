import "dotenv/config";
import { Router, Request, Response, NextFunction } from 'express';
import { getPrisma } from '../prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sharedMockStore } from '../sharedStore';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'rentalops-dev-secret-2024';
const JWT_EXPIRES_IN = '7d';

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateToken(user: { id: string; role: string }) {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function stripPassword<T extends { password?: string }>(user: T): Omit<T, 'password'> {
    const { password: _, ...safe } = user;
    return safe;
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Prisma unique constraint violation error code
const PRISMA_UNIQUE_VIOLATION = 'P2002';

// Mock storage is now handled via sharedMockStore
const SALT_ROUNDS = 10;

// ─── Middleware: verify JWT ─────────────────────────────────────────────────
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        (req as any).user = payload;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
    }
}

export function requireRole(...roles: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ error: `Access denied. Requires one of: ${roles.join(', ')}` });
        }
        next();
    };
}

// ─── POST /auth/register ────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (!name || !email || !password) {
        return res.status(400).json({ error: "name, email, and password are required." });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // ── Role policy ───────────────────────────────────────────────────────────
    // ADMIN: Cannot self-register. Admins are pre-seeded by the system.
    if (role === 'ADMIN') {
        return res.status(403).json({
            error: "Admin accounts cannot be self-registered. Contact the system administrator."
        });
    }
    // MIDDLEMAN: Allowed — they still need admin approval for every listing.
    // CUSTOMER: Allowed freely.
    const validRoles = ['MIDDLEMAN', 'CUSTOMER'];
    const userRole = validRoles.includes(role) ? role : 'CUSTOMER';

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const normalizedEmail = email.toLowerCase().trim();

    // ── DB path ────────────────────────────────────────────────────────────────
    const p = getPrisma();
    if (p) {
        try {
            // Check for existing user first (gives a cleaner error message)
            const existing = await p.user.findUnique({ where: { email: normalizedEmail } });
            if (existing) {
                return res.status(409).json({ error: "An account with this email already exists. Please log in." });
            }

            const user = await p.user.create({
                data: { name: name.trim(), email: normalizedEmail, password: hashedPassword, role: userRole }
            });
            const safeUser = stripPassword(user);
            const token = generateToken(safeUser as any);
            
            // Cache in mock store for cross-module fallback safety
            sharedMockStore.addUser({ ...user, createdAt: user.createdAt || new Date() } as any);
            
            return res.status(201).json({ ...safeUser, token });

        } catch (error: any) {
            // Handle Prisma unique constraint violation (race condition between check and insert)
            if (error.code === PRISMA_UNIQUE_VIOLATION) {
                return res.status(409).json({ error: "An account with this email already exists. Please log in." });
            }
            // For any other DB error, log it and fall through to mock
            console.error('[Register] DB error:', error.message);
        }
    }

    // ── Mock fallback (only when DB is fully unavailable) ─────────────────────
    const existingMock = sharedMockStore.findUserByEmail(normalizedEmail);
    if (existingMock) {
        return res.status(409).json({ error: "An account with this email already exists. Please log in." });
    }
    const newUser: any = {
        id: 'user-' + Date.now(),
        name: name.trim(), email: normalizedEmail, password: hashedPassword,
        role: userRole, createdAt: new Date()
    };
    sharedMockStore.addUser(newUser);
    const safeUser = stripPassword(newUser);
    const token = generateToken(safeUser as any);
    return res.status(201).json({ ...safeUser, token });
});

// ─── POST /auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const p = getPrisma();
    // ── DB path ────────────────────────────────────────────────────────────────
    if (p) {
        try {
            const user = await p.user.findUnique({ where: { email: normalizedEmail } });
            if (user) {
                // Support bcrypt hashed and legacy plaintext passwords
                const isValidPassword = user.password.startsWith('$2')
                    ? await bcrypt.compare(password, user.password)
                    : user.password === password;
                if (!isValidPassword) {
                    return res.status(401).json({ error: "Invalid email or password." });
                }
                const safeUser = stripPassword(user);
                const token = generateToken(safeUser as any);
                // Also cache in mock store for cross-module fallback safety
                sharedMockStore.addUser({ ...user, createdAt: user.createdAt || new Date() } as any);
                return res.status(200).json({ ...safeUser, token });
            }
            // Not found in DB, perfectly fine, fall through to check mock users.
        } catch (error: any) {
            console.error('[Login] DB error:', error.message);
            // Fall through to mock only on DB failure
        }
    }

    // ── Mock fallback ──────────────────────────────────────────────────────────
    const user = sharedMockStore.findUserByEmail(normalizedEmail);
    if (!user) return res.status(401).json({ error: "Invalid email or password." });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: "Invalid email or password." });
    const safeUser = stripPassword(user);
    const token = generateToken(safeUser as any);
    return res.status(200).json({ ...safeUser, token });
});

// ─── GET /auth/users (admin only) ──────────────────────────────────────────
router.get('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
    const p = getPrisma();
    if (p) {
        try {
            const users = await p.user.findMany({
                select: { id: true, name: true, email: true, role: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            });
            return res.status(200).json(users);
        } catch (error: any) {
            console.error('[Users] DB error:', error.message);
        }
    }
    return res.status(200).json(sharedMockStore.mockUsers.map(({ password, ...u }: any) => u));
});

export default router;
