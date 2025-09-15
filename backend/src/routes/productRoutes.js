const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { listProducts } = require('../controllers/productController');

// Protect all product routes
router.use(authenticate);

// GET /api/products
router.get('/', listProducts);

module.exports = router;


