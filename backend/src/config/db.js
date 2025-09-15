// Import required dependencies
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use Railway's full connection URL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'mysql',
  dialectOptions: {
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    paranoid: true,
  },
});

// Function to test DB connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(' Database connection established successfully.');
    return true;
  } catch (error) {
    console.error(' Unable to connect to database:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
