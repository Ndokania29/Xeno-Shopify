const { Sequelize } = require('sequelize');
require('dotenv').config();

const { DATABASE_URL } = process.env;

const sequelize = DATABASE_URL
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
      pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
      define: { timestamps: true, paranoid: true }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
        define: { timestamps: true, paranoid: true }
      }
    );

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

module.exports = { sequelize, testConnection };