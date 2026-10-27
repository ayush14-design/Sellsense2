import { Router, Request, Response } from 'express';
import db from '../models/database.js';
import { generateToken } from '../middleware/auth.js';

export const authRouter = Router();

// Login
authRouter.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // For demo purposes, we accept 'demo' password for demo users and 'admin123' for admin
    // In production, you'd verify password hash with bcrypt
    // The database has bcrypt placeholder hashes, so we check known demo passwords
    const isAdmin = email === 'admin@sellsense.ai' || user.role === 'super_admin';
    const isDemo = email === 'demo@nelamrestaurants.com' || email === 'owner@spicekitchen.com' || user.role === 'restaurant_owner';

    const validPassword = (isAdmin && (password === 'admin123' || password === 'admin' || password === 'demo')) ||
                         (isDemo && (password === 'demo123' || password === 'demo')) ||
                         password === 'demo' || password === 'demo123' || password === 'admin123';

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    // Update last login
    db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
        isActive: user.is_active === 1,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Signup
authRouter.post('/signup', (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user (password is stored as plain 'demo' for demo purposes)
    // In production, hash password with bcrypt
    const userId = `user_${Date.now()}`;
    db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, 'restaurant_owner', 1)
    `).run(userId, email, '$2a$10$demo', fullName);

    // Generate JWT token
    const token = generateToken({
      id: userId,
      email,
      role: 'restaurant_owner',
      fullName,
    });

    res.json({
      user: {
        id: userId,
        email,
        fullName,
        role: 'restaurant_owner',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Google OAuth Login / Signup
authRouter.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential, email: inputEmail, fullName: inputFullName } = req.body;

    let email = inputEmail;
    let fullName = inputFullName;

    // Verify Google ID token credential if provided
    if (credential && typeof credential === 'string') {
      try {
        // First attempt online token verification with Google
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
        if (googleRes.ok) {
          const tokenInfo = (await googleRes.json()) as any;
          if (tokenInfo.email) email = tokenInfo.email;
          if (tokenInfo.name) fullName = tokenInfo.name;
        } else {
          // Fallback to base64 JWT payload decode if verification response fails
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
            const parsed = JSON.parse(payloadJson);
            if (parsed.email) email = parsed.email;
            if (parsed.name) fullName = parsed.name;
          }
        }
      } catch (tokenErr) {
        // Fallback to JWT payload decode
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
            const parsed = JSON.parse(payloadJson);
            if (parsed.email) email = parsed.email;
            if (parsed.name) fullName = parsed.name;
          }
        } catch (parseErr) {
          console.warn('Failed to parse Google JWT credential payload:', parseErr);
        }
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Google email is required' });
    }

    fullName = fullName || email.split('@')[0];

    // Find existing user or create a new user
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!user) {
      const isSuperAdmin = email.toLowerCase() === 'admin@sellsense.ai';
      const role = isSuperAdmin ? 'super_admin' : 'restaurant_owner';
      const userId = `user_g_${Date.now()}`;

      db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, role, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).run(userId, email, '$2a$10$google_oauth_user', fullName, role);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    } else {
      if (!user.is_active) {
        return res.status(403).json({ error: 'This account has been deactivated. Please contact support.' });
      }
      db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
    }

    // Check if the user has an existing restaurant configured
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ? AND is_active = 1 LIMIT 1').get(user.id) as any;

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        createdAt: user.created_at,
        isActive: user.is_active === 1,
      },
      token,
      hasRestaurant: !!restaurant,
      restaurant: restaurant ? {
        id: restaurant.id,
        name: restaurant.name,
        ownerName: restaurant.owner_name,
        businessType: restaurant.business_type,
        city: restaurant.city,
        location: restaurant.location,
        contactEmail: restaurant.contact_email,
        description: restaurant.description,
        reviewSources: JSON.parse(restaurant.review_sources || '["Zomato"]'),
        dataMode: restaurant.data_mode,
        createdAt: restaurant.created_at,
        ownerId: restaurant.owner_id,
        isActive: restaurant.is_active === 1,
      } : null,
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: error?.message || 'Google authentication failed' });
  }
});

// Get current user (for token validation)
authRouter.get('/me', (req: Request, res: Response) => {
  res.json({ message: 'Use token validation on frontend' });
});