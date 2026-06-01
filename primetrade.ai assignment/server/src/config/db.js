const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

const connectDB = async () => {
  try {
    let dbUrl = process.env.MONGODB_URI;

    // Fallback to in-memory database if no URI is provided
    if (!dbUrl) {
      console.log('⚠️ No MONGODB_URI provided in .env. Initializing MongoDB Memory Server...');
      mongod = await MongoMemoryServer.create();
      dbUrl = mongod.getUri();
      console.log(`🚀 MongoDB Memory Server started successfully at: ${dbUrl}`);
    }

    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`❌ Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
      console.log('🧹 MongoDB Memory Server stopped successfully.');
    }
  } catch (error) {
    console.error(`❌ Error disconnecting database: ${error.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
