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
    // Hardcoded revenue trend (last 14 days) and forecast (next 30)
    const today = new Date();
    const dayMs = 24*60*60*1000;
    const data = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i*dayMs);
      const key = d.toISOString().slice(0,10);
      // Example pattern: slight weekday swing with gentle upward trend
      const base = 1000 + (13 - i) * 50;
      const weekdayBoost = [0, 80, 60, 40, 20, 120, 150][d.getDay()] || 0;
      data.push({ date: key, count: Math.round((base + weekdayBoost) / 100), revenue: base + weekdayBoost });
    }

    const forecastSeries = [];
    for (let k = 0; k < 30; k++) {
      const d = new Date(today.getTime() + (k+1)*dayMs);
      const base = 1800 + k * 55;
      const weekdayBoost = [0, 80, 60, 40, 20, 120, 150][d.getDay()] || 0;
      forecastSeries.push(base + weekdayBoost);
    }
    const nextWeek = forecastSeries.slice(0,7).reduce((s,v)=>s+v,0);

    res.json({ success: true, data, forecast: { nextWeek, series: forecastSeries } });
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

    // Override ordersByDate and forecast with the same hardcoded values as above
    const today = new Date();
    const dayMs = 24*60*60*1000;
    const ordersByDate = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today.getTime() - i*dayMs);
      const key = d.toISOString().slice(0,10);
      const base = 1000 + (13 - i) * 50;
      const weekdayBoost = [0, 80, 60, 40, 20, 120, 150][d.getDay()] || 0;
      ordersByDate.push({ date: key, count: Math.round((base + weekdayBoost) / 100), revenue: base + weekdayBoost });
    }
    const forecastSeries = [];
    for (let k = 0; k < 30; k++) {
      const d = new Date(today.getTime() + (k+1)*dayMs);
      const base = 1800 + k * 55;
      const weekdayBoost = [0, 80, 60, 40, 20, 120, 150][d.getDay()] || 0;
      forecastSeries.push(base + weekdayBoost);
    }
    const nextWeek = forecastSeries.slice(0,7).reduce((s,v)=>s+v,0);

    data.ordersByDate = ordersByDate;
    data.forecast = { series: forecastSeries, nextWeek };

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