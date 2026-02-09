from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .connection import manager
from .models import Card, get_db

app = FastAPI()

# 1. CORS Middleware (Allows React to talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Helper to get cards from DB
def get_all_cards():
    db = get_db()
    cards = db.query(Card).all()
    
    # Organize into columns
    board_state = {"todo": [], "doing": [], "done": []}
    for card in cards:
        board_state[card.column_id].append({
            "id": card.id, 
            "text": card.text, 
            "priority": card.priority # <--- Send priority to frontend
        })
    return board_state

# 3. The WebSocket Connection
@app.websocket("/ws/board")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    db = get_db()
    
    try:
        # Send existing data immediately upon connection
        current_state = get_all_cards()
        await websocket.send_json({"action": "update_board", "data": current_state})

        while True:
            # Wait for data from frontend
            data = await websocket.receive_json()
            
            # --- DATABASE SAVE LOGIC ---
            # 1. Clear old data
            db.query(Card).delete()
            
            # 2. Save new data with Priority
            for col_id, cards in data.items():
                for card_data in cards:
                    new_card = Card(
                        id=card_data['id'], 
                        text=card_data['text'], 
                        column_id=col_id,
                        priority=card_data.get('priority', 'low') # Default to low if missing
                    )
                    db.add(new_card)
            
            db.commit()
            # ---------------------------

            # Broadcast new state to everyone
            await manager.broadcast({
                "action": "update_board",
                "data": data
            })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        # Optional: Announce when someone leaves
        # await manager.broadcast({"message": "A user left"})