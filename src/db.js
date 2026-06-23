const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required. Copy .env.example to .env and update it.");
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
