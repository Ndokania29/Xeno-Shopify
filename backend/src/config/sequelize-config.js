require('dotenv').config();

const isEnvUrl = process.env.DATABASE_URL || process.env.DB_URL;
const isPostgres = isEnvUrl ? /^postgres(ql)?:/i.test(isEnvUrl) : false;

const mysqlCommon = {
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: { timestamps: true, paranoid: true },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
};

const pgCommon = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: { timestamps: true, paranoid: true },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
  dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
};

const configFromEnv = isEnvUrl
  ? {
      use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : 'DB_URL',
      ...(isPostgres ? pgCommon : mysqlCommon)
    }
  : {
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || null,
      database: process.env.DB_NAME || 'xeno',
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      ...mysqlCommon
    };

module.exports = {
  development: configFromEnv,
  test: configFromEnv,
  production: configFromEnv
};
