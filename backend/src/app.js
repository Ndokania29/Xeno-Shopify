require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');
const { initializeDatabase } = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const syncRoutes = require('./routes/syncRoutes');
const productRoutes = require('./routes/productRoutes');

// app.js or server.js
const dashboardRoutes = require('./routes/dashboardRoutes');




const app = express();


// CORS configuration
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const staticWhitelist = [
  ...defaultOrigins,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  // Reflects the request origin if in whitelist; allows non-browser clients (no origin)
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = new Set([...staticWhitelist, ...configuredOrigins]);
    if (allowedOrigins.size === 0) {
      // If no origins are configured, allow all to unblock local/dev usage
      return callback(null, true);
    }
    return allowedOrigins.has(origin) ? callback(null, true) : callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Optional: respond quickly to CORS preflight
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Xeno Shopify Data Ingestion & Insights Service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize application
const initializeApp = async () => {
  try {
    console.log('Initializing application...');

    // Test database connection
    await testConnection();
    console.log('Database connection established');

    // Initialize database models
    await initializeDatabase();
    console.log('Database models initialized');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
};

let server;

// Start server
const startServer = async (port = process.env.PORT || 3001) => {
  try {
    await initializeApp();
    
    server = app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
     
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    throw error;
  }
};

module.exports = { app, startServer, initializeApp };
