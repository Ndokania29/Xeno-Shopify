const express = require('express');
const { authenticate } = require('../middleware/auth');
const { 
  triggerFullSync,
  syncCustomers,
  syncProducts,
  syncOrders,
  getSyncStatus
} = require('../controllers/syncController');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// POST /api/sync/full
router.post('/full', triggerFullSync);

// POST /api/sync/customers
router.post('/customers', syncCustomers);

// POST /api/sync/products
router.post('/products', syncProducts);

// POST /api/sync/orders
router.post('/orders', syncOrders);

// GET /api/sync/status
router.get('/status', getSyncStatus);

module.exports = router;