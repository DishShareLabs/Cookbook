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
    const server = app.listen(port, () => {
      console.log(`Family Cookbook is running at http://localhost:${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Please stop the existing process or choose a different PORT.`);
        process.exit(1);
      }

      throw error;
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });
