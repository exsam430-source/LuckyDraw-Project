// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import drawRoutes from './routes/drawRoutes.js';
import prizeRoutes from './routes/prizeRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import paymentAccountRoutes from './routes/paymentAccountRoutes.js';

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/prizes', prizeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payment-accounts', paymentAccountRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Lucky Draw API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Lucky Draw API - Use /api/* endpoints' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server (important for Railway)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});