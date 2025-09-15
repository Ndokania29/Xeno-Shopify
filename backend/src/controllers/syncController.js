const IngestionService = require('../services/ingestionService');
const logger = require('../utils/logger');

// POST /api/sync/full
const triggerFullSync = async (req, res) => {
  try {
    const { tenantId, tenant } = req;
    const { forceFullSync = false } = req.body;

    logger.info('Full sync triggered', {
      tenantId,
      shopDomain: tenant.shopifyDomain,
      forceFullSync
    });

    // Start sync process
    const ingestionService = new IngestionService(tenant);
    const result = await ingestionService.syncAllData(forceFullSync);

    res.json({
      success: true,
      message: 'Full sync completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Full sync failed', {
      tenantId: req.tenantId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Full sync failed: ' + error.message
    });
  }
};

// POST /api/sync/customers
const syncCustomers = async (req, res) => {
  try {
    const { tenantId, tenant } = req;
    const { sinceId, limit = 250 } = req.query;

    logger.info('Customers sync triggered', {
      tenantId,
      shopDomain: tenant.shopifyDomain,
      sinceId,
      limit
    });

    const ingestionService = new IngestionService(tenant);
    const result = await ingestionService.syncCustomers({
      sinceId: sinceId ? parseInt(sinceId) : null,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Customers sync completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Customers sync failed', {
      tenantId: req.tenantId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Customers sync failed: ' + error.message
    });
  }
};

// POST /api/sync/products
const syncProducts = async (req, res) => {
  try {
    const { tenantId, tenant } = req;
    const { sinceId, limit = 250 } = req.query;

    logger.info('Products sync triggered', {
      tenantId,
      shopDomain: tenant.shopifyDomain,
      sinceId,
      limit
    });

    const ingestionService = new IngestionService(tenant);
    const result = await ingestionService.syncProducts({
      sinceId: sinceId ? parseInt(sinceId) : null,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      message: 'Products sync completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Products sync failed', {
      tenantId: req.tenantId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Products sync failed: ' + error.message
    });
  }
};

// POST /api/sync/orders
const syncOrders = async (req, res) => {
  try {
    const { tenantId, tenant } = req;
    const { sinceId, limit = 250, status = 'any' } = req.query;

    logger.info('Orders sync triggered', {
      tenantId,
      shopDomain: tenant.shopifyDomain,
      sinceId,
      limit,
      status
    });

    const ingestionService = new IngestionService(tenant);
    const result = await ingestionService.syncOrders({
      sinceId: sinceId ? parseInt(sinceId) : null,
      limit: parseInt(limit),
      status
    });

    res.json({
      success: true,
      message: 'Orders sync completed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Orders sync failed', {
      tenantId: req.tenantId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Orders sync failed: ' + error.message
    });
  }
};

// GET /api/sync/status
const getSyncStatus = async (req, res) => {
  try {
    const { tenantId, tenant } = req;

    const ingestionService = new IngestionService(tenant);
    const status = await ingestionService.getSyncStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status: ' + error.message
    });
  }
};

module.exports = {
  triggerFullSync,
  syncCustomers,
  syncProducts,
  syncOrders,
  getSyncStatus
};
