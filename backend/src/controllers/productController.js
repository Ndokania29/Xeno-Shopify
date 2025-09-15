const productService = require('../services/productService');

const listProducts = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { page = 1, limit = 50, search, status, vendor, productType } = req.query;
    const data = await productService.listProducts(tenantId, {
      page: Number(page),
      limit: Math.min(200, Number(limit)),
      search,
      status,
      vendor,
      productType
    });
    res.json({ success: true, ...data });
  } catch (err) { next(err); }
};

module.exports = { listProducts };


