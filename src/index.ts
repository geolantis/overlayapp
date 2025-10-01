/**
 * Main Application Entry Point
 * Express server with billing API endpoints
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { billingController } from './controllers/billing.controller';
import { logger } from './utils/logger';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
// For Stripe webhooks, we need raw body
app.use('/api/billing/webhooks/stripe', express.raw({ type: 'application/json' }));
// For other endpoints, use JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple auth middleware (replace with your actual auth)
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // This is a placeholder - implement your actual authentication
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Mock user - replace with actual token verification
  req.user = {
    id: 'user-id-from-token',
    email: 'user@example.com',
  };

  next();
};

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes

// Public routes
app.get('/api/billing/plans', billingController.getPlans.bind(billingController));

// Webhook routes (no auth required)
app.post(
  '/api/billing/webhooks/stripe',
  billingController.handleStripeWebhook.bind(billingController)
);

// Protected routes (require authentication)
app.post(
  '/api/billing/checkout',
  authMiddleware,
  billingController.createCheckout.bind(billingController)
);

app.post(
  '/api/billing/portal',
  authMiddleware,
  billingController.createPortalSession.bind(billingController)
);

app.get(
  '/api/billing/subscription',
  authMiddleware,
  billingController.getSubscription.bind(billingController)
);

app.put(
  '/api/billing/subscription/:id',
  authMiddleware,
  billingController.updateSubscription.bind(billingController)
);

app.delete(
  '/api/billing/subscription/:id',
  authMiddleware,
  billingController.cancelSubscription.bind(billingController)
);

app.post(
  '/api/billing/subscription/:id/reactivate',
  authMiddleware,
  billingController.reactivateSubscription.bind(billingController)
);

app.get(
  '/api/billing/usage',
  authMiddleware,
  billingController.getUsage.bind(billingController)
);

app.get(
  '/api/billing/invoices',
  authMiddleware,
  billingController.getInvoices.bind(billingController)
);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Payment system server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export default app;
