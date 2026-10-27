import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../models/database.js';
import { UserRow } from '../models/database.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sellsense-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    fullName: string;
  };
}

export function generateToken(user: { id: string; email: string; role: string; fullName: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: string; fullName: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string; fullName: string };
  } catch (error) {
    return null;
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  // Verify user still exists and is active
  const user = db.prepare('SELECT id, email, role, full_name, is_active FROM users WHERE id = ?').get(decoded.id) as UserRow | undefined;
  if (!user || !user.is_active) {
    return res.status(403).json({ error: 'User not found or deactivated' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.full_name,
  };

  next();
}

export function requireSuperAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin access required' });
  }
  next();
}

export function requireAdminOrAbove(req: AuthRequest, res: Response, next: NextFunction) {
  const allowedRoles = ['super_admin', 'admin'];
  if (!allowedRoles.includes(req.user?.role || '')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || '')) {
      return res.status(403).json({ error: `Requires one of: ${roles.join(', ')}` });
    }
    next();
  };
}

// Optional authentication - doesn't fail if no token
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      const user = db.prepare('SELECT id, email, role, full_name, is_active FROM users WHERE id = ?').get(decoded.id) as UserRow | undefined;
      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
        };
      }
    }
  }
  next();
}

export { JWT_SECRET };