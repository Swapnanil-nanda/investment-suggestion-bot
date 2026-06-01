const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB, disconnectDB } = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

let server;

// Start server function
const startServer = async () => {
  // Connect to database (either real MongoDB URI or Memory Server fallback)
  await connectDB();

  server = app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`📑 Swagger Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Frontend client served at http://localhost:${PORT}`);
  });
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION! Shutting down server...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

// Run server
startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('🔥 UNHANDLED REJECTION! Shutting down server gracefully...');
  console.error(err.name, err.message);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM/SIGINT for clean shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🧹 ${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('💤 Express server closed.');
      await disconnectDB();
      console.log('👋 Goodbye!');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
