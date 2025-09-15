const { startServer } = require('./app');

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
// require('dotenv').config();
// const app = require('./app');          // Express app import
// const { sequelize } = require('./config/db');

// const PORT = process.env.PORT || 3000;

// const startServer = async () => {
//   try {
//     // Test DB connection
//     await sequelize.authenticate();
//     console.log('✅ Database connected successfully');

//     // Start server
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on http://localhost:${PORT}`);
//       console.log(`🌍 Accepting requests from: ${process.env.CORS_ORIGINS || 'Not defined'}`);
//     });
//   } catch (error) {
//     console.error('❌ Server startup failed:', error.message);
//     process.exit(1);
//   }
// };

// startServer();
