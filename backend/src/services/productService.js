const { Op } = require('sequelize');
const { Product } = require('../models');

async function listProducts(tenantId, { page = 1, limit = 50, search, status, vendor, productType } = {}) {
  const where = { tenantId };
  if (status) where.status = status;
  if (vendor) where.vendor = vendor;
  if (productType) where.productType = productType;
  if (search) {
    where.title = { [Op.iLike || Op.like]: `%${search}%` };
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Product.findAndCountAll({
    where,
    order: [['updatedAt', 'DESC']],
    offset,
    limit,
    attributes: ['id','shopifyId','title','vendor','productType','status','price','cost','inventoryQuantity','tags','sku','variants','shopifyCreatedAt','shopifyUpdatedAt']
  });

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
}

module.exports = { listProducts };


