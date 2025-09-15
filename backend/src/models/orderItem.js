const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// OrderItem model - connects Orders with Products and stores quantity/price details
const OrderItem = sequelize.define('OrderItem', {
    // Unique identifier for each order item
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },

    // Reference to the order this item belongs to
    orderId: {
        type: DataTypes.UUID,
        allowNull: false
    },

    // Reference to the product
    productId: {
        type: DataTypes.UUID,
        allowNull: false
    },

    // Shopify line item ID for sync purposes
    shopifyLineItemId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },

    // Quantity ordered
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },

    // Price at the time of order (products prices can change over time)
    priceAtTime: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },

    // Total price (quantity * price)
    totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },

    // Product title at time of order (in case product name changes later)
    title: {
        type: DataTypes.STRING(500),
        allowNull: false
    },

    // Product variant info (size, color, etc)
    variantInfo: {
        type: DataTypes.JSON,
        allowNull: true
    },
    sku: {
        type: DataTypes.STRING(100),
        allowNull: true
   },


    // Track discount information
    discounted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },

    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'order_items',
    timestamps: true,
    indexes: [
        // For faster order lookups
        {
            fields: ['orderId']
        },
        // For product performance analysis
        {
            fields: ['productId']
        },
        // For syncing with Shopify
        {
            unique: true,
            fields: ['shopifyLineItemId']
        }
    ]
});

// Add a hook to calculate total price before save
OrderItem.beforeSave(async (orderItem) => {
    orderItem.totalPrice = orderItem.quantity * orderItem.priceAtTime;
});

module.exports = OrderItem;