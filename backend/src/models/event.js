
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tenantId: { type: DataTypes.UUID, allowNull: false },
  shopifyId: { type: DataTypes.STRING, allowNull: true }, // optional shopify id of checkout/cart
  type: { type: DataTypes.ENUM('cart_created','checkout_started','checkout_completed'), allowNull: false },
  payload: { type: DataTypes.JSON, defaultValue: {} },
  createdAtShop: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: 'events',
  timestamps: true,
  updatedAt: false
});

module.exports = Event;
