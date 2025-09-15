// Get the tools we need from Sequelize
const { DataTypes } = require('sequelize');
// Import our database connection
const { sequelize } = require('../config/db');

// Create our Customer model - this will store all customer data from Shopify
const Customer = sequelize.define('Customer', {
  // Unique identifier for each customer in our database
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  // Link to store/tenant - helps us separate customers from different shops
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  // Original Shopify customer ID - needed for syncing
  shopifyId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  // Basic customer info
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  // Marketing preferences
  acceptsMarketing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // Customer value metrics
  totalSpent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  // Customer account status
  state: {
    type: DataTypes.ENUM('enabled', 'disabled', 'invited', 'declined', 'archived'),
    defaultValue: 'enabled'
  },
  // Additional customer details
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  verifiedEmail: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  // For Shopify multipass login
  multipassIdentifier: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Customer tags - stored as comma-separated string, accessed as array
  tags: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const tags = this.getDataValue('tags');
      return tags ? tags.split(',') : [];
    },
    set(value) {
      this.setDataValue('tags', Array.isArray(value) ? value.join(',') : value);
    }
  },
  // Last order information
  lastOrderId: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  lastOrderName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  // Customer addresses stored as JSON
  addresses: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Marketing tracking
  acceptsMarketingUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  marketingOptInLevel: {
    type: DataTypes.ENUM('single_opt_in', 'confirmed_opt_in', 'unknown'),
    defaultValue: 'unknown'
  },
  // Track when we last synced this customer
  syncedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  // Table configuration
  tableName: 'customers',
  timestamps: true,  // Adds createdAt and updatedAt
  paranoid: true,   // Soft deletes - marks records as deleted instead of removing
  // Database indexes for faster queries
  indexes: [
    {
      unique: true,
      fields: ['tenantId', 'shopifyId']  // Each customer must be unique per store
    },
    {
      fields: ['tenantId', 'email']      // Fast customer lookups by email
    },
    {
      fields: ['tenantId', 'state']      // Filter by customer state
    },
    {
      fields: ['tenantId', 'totalSpent'] // Sort by customer value
    },
    {
      fields: ['tenantId', 'createdAt']  // Timeline queries
    }
  ]
});

// Export the model for use in other files
module.exports = Customer;
