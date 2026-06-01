const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');

// Route files
const authRoutes = require('./routes/v1/auth.routes');
const productRoutes = require('./routes/v1/product.routes');

// Middleware
const { errorHandler } = require('./middleware/error.middleware');

// Initialize app
const app = express();

// Apply security headers via Helmet (with CORS considerations for script loading in same origin)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        "img-src": ["'self'", "data:", "cdn.jsdelivr.net"],
      },
    },
  })
);

// Enable CORS
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../../client')));

// Swagger API Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'Healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);

// Catch-all route to serve the SPA client for dashboard navigation or missing pages
app.get('*', (req, res, next) => {
  // If request is for an API path, pass to error handler
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API Route not found: ${req.originalUrl}`,
    });
  }
  // Otherwise, serve landing index.html
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
