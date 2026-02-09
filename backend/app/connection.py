from fastapi import WebSocket
from typing import List

class ConnectionManager:
    def __init__(self):
        # This list tracks all currently connected users
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # This loops through all connected users and sends the message
        for connection in self.active_connections:
            await connection.send_json(message)

# Initialize the manager to be imported in main.py
manager = ConnectionManager()