// Import required dependencies
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize instance (MySQL connection)
const sequelize = new Sequelize(
  process.env.DB_NAME,  // Database name from .env
  process.env.DB_USER,      // Username from .env
  process.env.DB_PASS,       // Password from .env
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',// Using MySQL

    
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    
    pool: {
      max: 5,       
      min: 0,
      acquire: 30000, 
      idle: 10000    
    },
    define: {
      timestamps: true,   
      paranoid: true     
    },

  }
);

// Function to test DB connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to database:', error.message);
    return false;
  }
};

// Export sequelize instance and test function
module.exports = {sequelize,testConnection};
