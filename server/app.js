const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const storeRoutes = require('./routes/storeRoutes');
const orderRoutes = require('./routes/orderRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const medicineCatalogRoutes = require('./routes/medicineCatalogRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const saleRoutes = require('./routes/saleRoutes');
const publicRoutes = require('./routes/publicRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const pharmacyDiscoveryRoutes = require('./routes/pharmacyDiscoveryRoutes');
const pharmacyConnectionRoutes = require('./routes/pharmacyConnectionRoutes');
const pharmacyChatRoutes = require('./routes/pharmacyChatRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust the reverse proxy used by hosting platforms such as Render
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
// CLIENT_URL should contain your deployed frontend URL in production.
// Example:
// CLIENT_URL=https://your-pharmacy-app.vercel.app
const configuredClientUrl =
  process.env.CLIENT_URL || 'http://localhost:5173';

const allowedOrigins = [configuredClientUrl];

// Allow localhost and 127.0.0.1 equivalents during local development
try {
  const url = new URL(configuredClientUrl);

  if (url.hostname === 'localhost') {
    allowedOrigins.push(
      `${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ''}`
    );
  } else if (url.hostname === '127.0.0.1') {
    allowedOrigins.push(
      `${url.protocol}//localhost${url.port ? `:${url.port}` : ''}`
    );
  }
} catch {
  // Keep the configured origin if CLIENT_URL is invalid
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize input against NoSQL injection
app.use(mongoSanitize());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/auth', authLimiter);

// Health check - useful for Render and uptime monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MediChain API is running',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/medicine-catalog', medicineCatalogRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/pharmacy-network', pharmacyDiscoveryRoutes);
app.use('/api/pharmacy-network', pharmacyConnectionRoutes);
app.use('/api/pharmacy-network', pharmacyChatRoutes);

// 404 + centralized error handler (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
