import { useState, useEffect } from "react"
import axios from "axios"

const API = ""

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    const res = await axios.get(`${API}/tasks`)
    setTasks(res.data)
  }

  const createTask = async () => {
    if (!title.trim()) return
    await axios.post(`${API}/tasks`, { title })
    setTitle("")
    fetchTasks()
  }

  const toggleTask = async (id) => {
    await axios.put(`${API}/tasks/${id}`)
    fetchTasks()
  }

  const deleteTask = async (id) => {
    await axios.delete(`${API}/tasks/${id}`)
    fetchTasks()
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Task Manager🚀</h1>
      
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createTask()}
          placeholder="Add a new task..."
          style={{ flex: 1, padding: "8px", fontSize: "16px" }}
        />
        <button onClick={createTask} style={{ padding: "8px 16px" }}>
          Add
        </button>
      </div>

      {tasks.length === 0 && <p>No tasks yet. Add one above!</p>}

      {tasks.map(task => (
        <div key={task.id} style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          padding: "12px",
          marginBottom: "8px",
          border: "1px solid #ddd",
          borderRadius: "4px"
        }}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTask(task.id)}
          />
          <span style={{ 
            flex: 1,
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "#999" : "#000"
          }}>
            {task.title}
          </span>
          <button onClick={() => deleteTask(task.id)} style={{ color: "red" }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}

export default App