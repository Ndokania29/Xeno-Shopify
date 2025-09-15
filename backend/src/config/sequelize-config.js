require('dotenv').config();

const common = {
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: { timestamps: true, paranoid: true },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
};

const envVarName = process.env.DATABASE_URL
  ? 'DATABASE_URL'
  : process.env.DB_URL
  ? 'DB_URL'
  : null;

const configFromEnv = envVarName
  ? {
      use_env_variable: envVarName,
      ...(process.env.NODE_ENV !== 'development'
        ? { dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } }
        : {}),
      ...common
    }
  : {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || null,
      database: process.env.DB_NAME || 'xeno',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      ...common
    };

module.exports = {
  development: configFromEnv,
  test: configFromEnv,
  production: configFromEnv
};
