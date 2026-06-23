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

    const message = error?.message || "The cookbook API could not start.";
    return res.status(500).json({
      message
    });
  }
};
