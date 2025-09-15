const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tenants',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  shopifyId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  orderNumber: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  financialStatus: {
    type: DataTypes.ENUM('pending', 'authorized', 'partially_paid', 'paid', 'partially_refunded', 'refunded', 'voided'),
    defaultValue: 'pending'
  },
  fulfillmentStatus: {
    type: DataTypes.ENUM('fulfilled', 'null', 'partial', 'restocked'),
    defaultValue: 'null'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  subtotalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  totalTax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  totalDiscounts: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },

  totalQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancelReason: {
    type: DataTypes.ENUM('customer', 'fraud', 'inventory', 'declined', 'other'),
    allowNull: true
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
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
  test: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  buyerAcceptsMarketing: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  confirmed: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  referringSite: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  landingSite: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  sourceName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  noteAttributes: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  processingMethod: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: true
  },
  customerLocale: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  shopifyCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  shopifyUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  syncedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'orders',
  timestamps: true,
  paranoid: true,
  indexes: [
    {
      unique: true,
      fields: ['tenantId', 'shopifyId']
    },
    {
      fields: ['tenantId', 'customerId']
    },
    {
      fields: ['tenantId', 'financialStatus']
    },
    {
      fields: ['tenantId', 'fulfillmentStatus']
    },
    {
      fields: ['tenantId', 'totalPrice']
    },
    {
      fields: ['tenantId', 'processedAt']
    },
    {
      fields: ['tenantId', 'createdAt']
    }
  ]
});

module.exports = Order;
