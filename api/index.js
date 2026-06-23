const dotenv = require("dotenv");

const app = require("../src/app");
const connectDatabase = require("../src/db");

dotenv.config();

module.exports = async function handler(req, res) {
  try {
    await connectDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API startup error:", error);
    return res.status(500).json({
      message: "The cookbook API could not connect to the database."
    });
  }
};
