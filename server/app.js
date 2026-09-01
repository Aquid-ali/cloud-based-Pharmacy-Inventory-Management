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
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers
app.use(helmet());

// CORS - restrict to the configured client origin, plus its 127.0.0.1 equivalent
// (some browsers/tools resolve "localhost" and "127.0.0.1" as different origins)
const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [configuredClientUrl];
try {
  const url = new URL(configuredClientUrl);
  if (url.hostname === 'localhost') {
    allowedOrigins.push(`${url.protocol}//127.0.0.1:${url.port}`);
  } else if (url.hostname === '127.0.0.1') {
    allowedOrigins.push(`${url.protocol}//localhost:${url.port}`);
  }
} catch {
  // configuredClientUrl wasn't a valid URL - fall back to the single allowed origin above
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

// Basic rate limiting (protects auth endpoints from brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/auth', authLimiter);

// Health check - useful for uptime monitoring / load balancers
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MediChain API is running' });
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

// 404 + centralized error handler (must be last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
