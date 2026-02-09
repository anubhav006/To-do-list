import { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Layout, Plus, ArrowRight, ArrowLeft, Trash2, Edit2, Zap } from 'lucide-react';

function App() {
  const WS_URL = 'ws://127.0.0.1:8000/ws/board';
  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(WS_URL);
  const [columns, setColumns] = useState({ todo: [], doing: [], done: [] });

  // Priority Colors
  const priorityColors = {
    high: "border-red-500 bg-red-500/10 text-red-200",
    medium: "border-yellow-500 bg-yellow-500/10 text-yellow-200",
    low: "border-green-500 bg-green-500/10 text-green-200"
  };

  useEffect(() => {
    if (lastJsonMessage?.action === 'update_board') {
      setColumns(lastJsonMessage.data);
    }
  }, [lastJsonMessage]);

  const updateBoard = (newColumns) => {
    setColumns(newColumns);
    sendJsonMessage(newColumns);
  };

  // ADVANCED FEATURE 1: Add with Priority
  const addTask = (colId) => {
    const text = prompt("📝 Task Name:");
    if (!text) return;
    
    // Simple way to ask for priority
    let priority = prompt("🔥 Priority? (h=High, m=Medium, l=Low)", "l");
    priority = priority.toLowerCase().startsWith('h') ? 'high' : 
               priority.toLowerCase().startsWith('m') ? 'medium' : 'low';

    const newCard = { id: Date.now(), text, priority };
    updateBoard({ ...columns, [colId]: [...columns[colId], newCard] });
  };

  // ADVANCED FEATURE 2: Edit Task
  const editTask = (card, colId) => {
    const newText = prompt("Edit Task:", card.text);
    if (!newText) return;

    const newList = columns[colId].map(c => 
      c.id === card.id ? { ...c, text: newText } : c
    );
    updateBoard({ ...columns, [colId]: newList });
  };

  const deleteCard = (cardId, colId) => {
    const newList = columns[colId].filter(c => c.id !== cardId);
    updateBoard({ ...columns, [colId]: newList });
  };

  // ADVANCED FEATURE 3: Clear Column
  const clearColumn = (colId) => {
    if(!confirm(`Delete ALL tasks in ${colId}?`)) return;
    updateBoard({ ...columns, [colId]: [] });
  };

  const moveCard = (card, fromCol, toCol) => {
    const sourceList = columns[fromCol].filter(c => c.id !== card.id);
    updateBoard({ ...columns, [fromCol]: sourceList, [toCol]: [...columns[toCol], card] });
  };

  return (
    <div className="app-container">
      <header>
        <h1><Layout color="#6c5ce7" size={32} /> SyncBoard <span style={{fontSize:'0.5em', opacity:0.5}}>PRO</span></h1>
        <div className={`status-badge ${readyState === ReadyState.OPEN ? 'status-live' : 'status-offline'}`}>
          {readyState === ReadyState.OPEN ? '● Live' : '○ Connecting...'}
        </div>
      </header>

      <div className="board-grid">
        {['todo', 'doing', 'done'].map(colId => (
          <div key={colId} className="column">
            <div className="column-header">
              <span className="column-title flex items-center gap-2">
                {colId.toUpperCase()}
                <span className="task-count">{columns[colId].length}</span>
              </span>
              {/* Clear Button */}
              {columns[colId].length > 0 && (
                 <button onClick={() => clearColumn(colId)} style={{fontSize:'0.7rem', opacity:0.5}}>Clear</button>
              )}
            </div>

            <div style={{minHeight: '100px'}}>
              {columns[colId].map(card => (
                <div key={card.id} className={`task-card group border-l-4 ${priorityColors[card.priority] || priorityColors.low}`}>
                  <div className="flex justify-between items-start">
                    <p style={{margin: 0, fontWeight: 500}}>{card.text}</p>
                    <span style={{fontSize:'0.6rem', textTransform:'uppercase', opacity:0.7}}>{card.priority}</span>
                  </div>
                  
                  <div className="card-actions">
                    <div className="flex gap-1">
                        {colId !== 'todo' && <button onClick={() => moveCard(card, colId, colId === 'done' ? 'doing' : 'todo')} className="action-btn"><ArrowLeft size={14} /></button>}
                    </div>
                    
                    <div className="flex gap-1">
                        <button onClick={() => editTask(card, colId)} className="action-btn text-blue-400"><Edit2 size={14} /></button>
                        <button onClick={() => deleteCard(card.id, colId)} className="action-btn text-red-400"><Trash2 size={14} /></button>
                    </div>

                    <div className="flex gap-1">
                        {colId !== 'done' && <button onClick={() => moveCard(card, colId, colId === 'todo' ? 'doing' : 'done')} className="action-btn"><ArrowRight size={14} /></button>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => addTask(colId)} className="add-btn">
              <Plus size={18} /> New Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;