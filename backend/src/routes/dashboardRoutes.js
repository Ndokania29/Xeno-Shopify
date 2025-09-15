// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboard = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// Protect all dashboard endpoints with authenticate()
router.use(authenticate);

// Overview and full dashboard
router.get('/overview', dashboard.getOverview);
router.get('/full', dashboard.getFullDashboard);

// Time-series data
router.get('/orders-by-date', dashboard.getOrdersByDate);  // query: startDate, endDate, groupBy

// Product analytics
router.get('/products/performance', dashboard.getProductPerformance);  // query: topN

// Customer analytics
router.get('/customers/insights', dashboard.getCustomerInsights);

// Funnel & profitability
router.get('/funnel', dashboard.getFunnel);  // query: days
router.get('/profitability', dashboard.getProfitability);  // query: topN

module.exports = router;