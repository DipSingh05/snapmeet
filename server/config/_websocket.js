import { WebSocketServer } from "ws"; // Import WebSocketServer directly
import { handleWebSocketConnection } from "../connection/handleWebSocket.js";

async function startWebSocketServer() {
    const port = process.env.WEBSOCKET_PORT || 9090;
    const wss = new WebSocketServer({
        port,
        host: "0.0.0.0",
        
    });

    // Map to store users and their WebSocket connections
    const users = {};
    const groupCalls = {}

    console.log(`Signaling server running on ws://localhost:${port} and ws://0.0.0.0:${port}`);

    wss.on("connection", (connection) => {

        console.log("New client connected");

        handleWebSocketConnection(connection, users, groupCalls);
        
        connection.send("Hello world");

    });

    return wss; // Return the server instance if needed
}

export { startWebSocketServer };

