// 1. FORCE PUBLIC DNS RESOLUTION TO BYPASS THE WINDOWS SRV LOOKUP BUG
const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// 2. LOAD YOUR DEPENDENCIES
const dotenv = require("dotenv");
const app = require("./src/app");
const connectDatabase = require("./src/db");

// 3. INITIALIZE ENVIRONMENT VARIABLES FROM YOUR .ENV FILE
dotenv.config();

const port = process.env.PORT || 3000;

// 4. ATTEMPT TO CONNECT TO MONGODB ATLAS AND START EXPRESS
connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Family Cookbook is running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
