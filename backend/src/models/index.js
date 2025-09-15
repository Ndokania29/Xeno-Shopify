const { sequelize } = require('../config/db');

// Import all models
const Tenant = require('./tenant');
const Customer = require('./customer');
const Product = require('./product');
const Order = require('./order');
const OrderItem = require('./orderItem');
const Event = require('./event');

// Define associations
const setupAssociations = () => {
  // Tenant associations (one-to-many)
  Tenant.hasMany(Customer, { 
    foreignKey: 'tenantId',
    as: 'customers',
    onDelete: 'CASCADE'
  });
  
  Tenant.hasMany(Product, { 
    foreignKey: 'tenantId',
    as: 'products',
    onDelete: 'CASCADE'
  });
  
  Tenant.hasMany(Order, { 
    foreignKey: 'tenantId',
    as: 'orders',
    onDelete: 'CASCADE'
  });

  // Customer associations
  Customer.belongsTo(Tenant, { 
    foreignKey: 'tenantId',
    as: 'tenant'
  });
  
  Customer.hasMany(Order, { 
    foreignKey: 'customerId',
    as: 'orders',
    onDelete: 'SET NULL'
  });

  // Product associations
  Product.belongsTo(Tenant, { 
    foreignKey: 'tenantId',
    as: 'tenant'
  });
  
  // Add these Product-Order associations
  Product.belongsToMany(Order, {
    through: OrderItem,
    foreignKey: 'productId',
    as: 'orders'
  });

  // Order associations
  Order.belongsTo(Tenant, { 
    foreignKey: 'tenantId',
    as: 'tenant'
  });
  
  Order.belongsTo(Customer, { 
    foreignKey: 'customerId',
    as: 'customer',
    onDelete: 'SET NULL'
  });
  
  // Add these Order-Product associations
  Order.belongsToMany(Product, {
    through: OrderItem,
    foreignKey: 'orderId',
    as: 'products'
  });

  // Add OrderItem associations explicitly
  OrderItem.belongsTo(Order, {
    foreignKey: 'orderId'
  });
  
  OrderItem.belongsTo(Product, {
    foreignKey: 'productId'
  });

  console.log('Database associations set up successfully');
};

// Initialize database with proper error handling
const initializeDatabase = async () => {
  try {
    // Setup associations
    setupAssociations();
    
    // Sync database with proper options for development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized in development mode');
    } else {
      await sequelize.sync();
      console.log('Database synchronized in production mode');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// Close database connection
const closeDatabase = async () => {
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Export all models and functions
module.exports = {
  sequelize,
  Tenant,
  Customer,
  Product,
  Order,
  OrderItem,
  Event,
  initializeDatabase,
  closeDatabase
};
