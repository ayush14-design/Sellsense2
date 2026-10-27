import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { zomatoRouter } from './routes/zomato.js';
import { adminRouter } from './routes/admin.js';
import { paymentRouter } from './routes/payment.js';
import { authRouter } from './routes/auth.js';
import { googleRouter } from './routes/google.js';
import { reviewsRouter } from './routes/reviews.js';
import { initializeDatabase } from './models/database.js';

dotenv.config();

// Initialize database at startup
initializeDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5180',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in local development
  },
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/zomato', zomatoRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/auth', authRouter);
app.use('/api/google', googleRouter);
app.use('/api/reviews', reviewsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 SellSense Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

export default app;