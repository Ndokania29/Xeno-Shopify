const dashboardService = require('../services/dashboardService');

const getOverview = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const data = await dashboardService.getOverview(tenantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getOrdersByDate = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { startDate, endDate, groupBy } = req.query;
    const result = await dashboardService.getOrdersByDate(tenantId, { startDate, endDate, groupBy });
    res.json({ success: true, data: result.data, forecast: { nextWeek: result.nextWeek, series: result.forecast } });
  } catch (err) { next(err); }
};

const getProductPerformance = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const result = await dashboardService.getProductPerformance(tenantId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

const getCustomerInsights = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const data = await dashboardService.getCustomerInsights(tenantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getFunnel = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const data = await dashboardService.getCheckoutFunnel(tenantId, { lookbackDays: req.query.days || 7 });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getProfitability = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const data = await dashboardService.getProfitability(tenantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getFullDashboard = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const data = await dashboardService.getFullDashboard(tenantId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getRecentOrders = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 10;
    const data = await dashboardService.getRecentOrders(tenantId, { limit });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getTopProducts = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const limit = parseInt(req.query.limit) || 10;
    const data = await dashboardService.getTopProducts(tenantId, { limit });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

module.exports = {
  getOverview,
  getOrdersByDate,
  getProductPerformance,
  getCustomerInsights,
  getFunnel,
  getProfitability,
  getFullDashboard,
  getRecentOrders,  // Added export
  getTopProducts    // Added export
};