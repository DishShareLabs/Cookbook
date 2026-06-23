const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("MongoDB connection string is required. Set MONGODB_URI, MONGO_URI, or DATABASE_URL.");
  }

  mongoose.set("strictQuery", true);

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000
    });
  }

  await global.mongooseConnectionPromise;
  return mongoose.connection;
}

module.exports = connectDatabase;
