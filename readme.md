# Zoom WebSocket Keep-Alive (TypeScript)

This project demonstrates how to connect to the **Zoom WebSocket server** and send a `ping` every 30 seconds to keep the connection alive using the `ws` library.

---

## Features

- Connects to Zoom WebSocket URL  
- Sends a `ping` every 30 seconds  
- Handles `pong` events from the server  
- Logs all messages received from Zoom  
- Gracefully handles errors and disconnections  

---

## Installation

1. Create a new project:
   ```mkdir zoom-ws-demo && cd zoom-ws-demo```

2. Initialize Node.js:
   ```npm init -y```

3. Install dependencies:
   ```npm install ws && npm install typescript @types/ws --save-dev```
    
4. Compile the code:
   ```npx tsc zoom-websocket.ts```

5. Run the code:
   ```node zoom-websocket.js```