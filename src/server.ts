import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/environment";

console.log("1. server.ts loaded");

const startServer = async () => {
  try {
    console.log("2. Starting server...");
    
    console.log("3. Connecting to MongoDB...");
    await connectDatabase();
    
    console.log("4. MongoDB connection completed");

    app.listen(env.port, () => {
      console.log(
        `5. Server running on http://localhost:${env.port}`
      );
    });

  } catch (error) {
    console.error("❌ SERVER STARTUP ERROR:");
    console.error(error);
    process.exit(1);
  }
};

startServer();