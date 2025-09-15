// First, get the tools we need from Sequelize
const { DataTypes } = require('sequelize');
// Get our database connection that we set up earlier
const { sequelize } = require('../config/db');

// Let's create our Product model - this is how we'll store product data from Shopify
const Product = sequelize.define('Product', {
  // Every product needs a unique ID in our system
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // This helps us know which store (tenant) owns this product
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  // We need to store Shopify's ID to sync data properly
  shopifyId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  // The name of the product (making it 500 chars to handle long names)
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  // Who makes/sells this product? (optional field)
  vendor: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // What kind of product is this? Like 'T-shirt', 'Shoes', etc.
  productType: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Is this product active, archived, or just a draft?
  status: {
    type: DataTypes.ENUM('active', 'archived', 'draft'),
    defaultValue: 'active'
  },
  // Product price - using decimal for accurate money values
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  // Product cost - for profitability calculations
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  // Product tags - we store as comma-separated text but work with them as arrays
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    // When we read tags, split them into an array
    get() {
      const value = this.getDataValue('tags');
      return value ? value.split(',') : [];
    },
    // When we save tags, join them into a comma-separated string
    set(value) {
      this.setDataValue('tags', Array.isArray(value) ? value.join(',') : value);
    }
  },
  // Stock Keeping Unit - unique product identifier
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  // Different versions of the product (like different sizes/colors)
  variants: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // When was this product created in Shopify?
  shopifyCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // When was this product last updated in Shopify?
  shopifyUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // When did we last sync this product with Shopify?
  syncedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  // Track inventory quantity
  inventoryQuantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  }
}, {
  // Name of our database table
  tableName: 'products',
  // Automatically manage createdAt and updatedAt
  timestamps: true,
  // Don't actually delete records, just mark them as deleted
  paranoid: true,
  // Make our database searches faster with these indexes
  indexes: [
    // Each product must be unique for a store
    { unique: true, fields: ['tenantId', 'shopifyId'] },
    // Help us search products by status for each store
    { fields: ['tenantId', 'status'] },
    // Make vendor searches faster
    { fields: ['tenantId', 'vendor'] },
    // Make product type searches faster
    { fields: ['tenantId', 'productType'] }
  ]
});

// Make our Product model available to other parts of the app
module.exports = Product;