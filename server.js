import { createServer } from "./server/config/_server.js";
// import { connectToDatabase } from "./server/config/_mongo.js";
import { startWebSocketServer } from "./server/config/_websocket.js";

(async () => {
  try {
    // Start the server first
    const app = await createServer();
    console.log("Server started successfully.");

    // After the server starts, connect to the database
    // const [client, users_collection, data_collection] = await connectToDatabase();
    // console.log("Connected to MongoDB.");

    // Start WebSocket server
    const socket = await startWebSocketServer();
    console.log("Connected to Websocket.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1); // Exit with failure code
  }
})();
