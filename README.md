# Production Deployment Guide: Full Stack App on a Raw VPS
### From Zero to Production — Go + React + Docker + CI/CD + Monitoring + Scaling + Backups

---

## Table of Contents

1. [What We Built](#what-we-built)
2. [How Engineers Think Before Building](#how-engineers-think-before-building)
3. [Prerequisites](#prerequisites)
4. [Phase 1 — Server Setup & Security](#phase-1--server-setup--security)
5. [Phase 2 — Building the Application](#phase-2--building-the-application)
6. [Phase 3 — Nginx Reverse Proxy + HTTPS](#phase-3--nginx-reverse-proxy--https)
7. [Phase 4 — CI/CD Pipeline](#phase-4--cicd-pipeline)
8. [Phase 5 — Monitoring & Logging](#phase-5--monitoring--logging)
9. [Phase 6 — Scaling & Load Balancing](#phase-6--scaling--load-balancing)
10. [Phase 7 — Backups & Disaster Recovery](#phase-7--backups--disaster-recovery)
11. [Quick Recreation Scripts](#quick-recreation-scripts)
12. [AI Prompt to Recreate This](#ai-prompt-to-recreate-this)

---

## What We Built

A complete production-grade deployment of a Task Manager application. Here's the full architecture:

```
Internet
    ↓
Nginx (Reverse Proxy + SSL)
    ↓              ↓
Frontend        /tasks, /health
(React/Nginx)   ↓
            Load Balancer (Nginx upstream)
                ↓           ↓           ↓
            backend-1   backend-2   backend-3
            (Go API)    (Go API)    (Go API)
                ↓           ↓           ↓
                    PostgreSQL Database
                           ↓
                    AWS S3 (Backups)

Monitoring Stack (separate):
Prometheus → collects metrics
Node Exporter → exposes server metrics
Grafana → visualizes everything
Loki → stores logs
Promtail → collects container logs
```

**Tech stack:**
- **Backend:** Go + Gin framework + GORM ORM
- **Frontend:** React + Vite + Axios
- **Database:** PostgreSQL 14
- **Web Server:** Nginx
- **Containerization:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana + Loki + Promtail
- **Backups:** AWS S3 + cron jobs
- **Server:** Hetzner VPS (CX23 — 2 vCPU, 4GB RAM)
- **Domain:** DuckDNS (free)
- **SSL:** Let's Encrypt (free)

---

## How Engineers Think Before Building

Before writing a single line of code, engineers ask these questions:

**1. What problem am I solving?**
We need to deploy a web app that is secure, automatically deployed, monitored, scalable, and backed up. Not just "make it work" — make it production ready.

**2. What are the constraints?**
- Budget: minimal ($7.50/month)
- Team: solo developer learning
- Requirements: everything a real production app needs

**3. What could go wrong?**
- Server gets hacked → need security hardening
- App crashes → need monitoring + auto-restart
- Database gets corrupted → need backups
- Traffic spikes → need scaling
- Manual deployment is slow → need CI/CD

**4. What tools exist for each problem?**
- Security → UFW firewall, fail2ban, SSH keys, no root login
- Monitoring → Prometheus + Grafana (industry standard)
- Backups → pg_dump + S3 + cron
- Scaling → Docker replicas + Nginx load balancing
- CI/CD → GitHub Actions (free, simple)

**5. In what order do we build?**
Security first (always). Then app. Then expose it safely. Then automate. Then observe. Then scale. Then protect data.

This order matters — you don't expose an unsecured server to the internet. You don't scale something you can't monitor. You don't skip backups until after you have data worth backing up.

---

## Prerequisites

**On your local machine (Windows):**
- Windows 10/11
- PowerShell (built in)
- Git installed
- Go installed (golang.org)
- Node.js + npm installed
- VS Code installed
- Docker Desktop installed

**Accounts needed:**
- Hetzner account (hetzner.com)
- GitHub account
- AWS account (for S3 backups)
- DuckDNS account (duckdns.org) — free

**Check your tools are ready:**
```powershell
ssh -V          # should show OpenSSH version
git --version   # should show git version
go version      # should show Go version
docker --version # should show Docker version
```

---

## Phase 1 — Server Setup & Security

### Why This Phase Exists

A fresh VPS is completely open. Root login is enabled. No firewall. Anyone can try to break in. Within minutes of a server being created, automated bots start trying to SSH into it.

This phase closes every door except the ones we need open.

### Step 1 — Generate SSH Key (on your local machine)

**What is an SSH key?**
Think of it as a padlock and key system. You put the padlock on the server (public key) and keep the key on your PC (private key). When you connect, the server checks if your key opens the padlock. No password needed and mathematically impossible to brute force.

```powershell
ssh-keygen -t ed25519 -C "vps-key"
```

Breaking down the command:
- `ssh-keygen` — the tool that generates SSH key pairs
- `-t ed25519` — the encryption algorithm. Ed25519 is modern, fast, and more secure than the older RSA algorithm
- `-C "vps-key"` — a comment/label so you remember what this key is for

When it asks for location — press **Enter** (accept default: `~/.ssh/id_ed25519`)
When it asks for passphrase — press **Enter** (no passphrase for simplicity)

This creates two files:
- `~/.ssh/id_ed25519` — your **private key** (NEVER share this)
- `~/.ssh/id_ed25519.pub` — your **public key** (goes on the server)

View your public key (you'll need this when creating the server):
```powershell
cat $env:USERPROFILE\.ssh\id_ed25519.pub
```

### Step 2 — Create the Server on Hetzner

**Why Hetzner over AWS for this?**
Hetzner CX23 gives 2 vCPU + 4GB RAM + 40GB SSD + 20TB traffic for ~$5/month. AWS EC2 equivalent costs $30-70/month plus separate charges for storage, traffic, and IP address. For learning and small production apps, Hetzner wins on price. AWS wins when you need its managed services ecosystem.

In Hetzner Console:
1. Create a new project
2. Add Server → Ubuntu 24.04 → CX23 (Regular Performance)
3. Add your SSH public key
4. Create server

Note the IP address — you'll need it for everything.

### Step 3 — First Login and System Update

SSH in as root (first and last time):
```powershell
ssh root@YOUR_SERVER_IP
```

Update the system immediately. Think of this like Windows Update — security patches for known vulnerabilities:
```bash
apt update && apt upgrade -y
```

- `apt update` — fetches the latest list of available package versions
- `apt upgrade -y` — installs all updates, `-y` automatically says yes to everything
- `&&` — only run the second command if the first succeeded

Reboot to apply kernel updates:
```bash
reboot
```

### Step 4 — Create a Non-Root User

**Why not use root?**
Root can do anything — delete every file, break the OS, no restrictions. One wrong command and your server is gone. A regular user with `sudo` privileges requires you to consciously elevate for dangerous operations.

```bash
adduser deploy
```

This asks for a password — set a strong one and remember it.

Give deploy admin privileges (ability to use sudo):
```bash
usermod -aG sudo deploy
```

- `usermod` — modify a user account
- `-aG sudo` — append to the sudo group (group that can use admin commands)
- `deploy` — the username

Copy your SSH key so you can log in as deploy:
```bash
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

- `rsync` — a file sync tool
- `--archive` — preserve all file attributes
- `--chown=deploy:deploy` — make deploy the owner of the copied files
- `~/.ssh` — copy root's SSH keys
- `/home/deploy` — to deploy's home directory

Test in a new PowerShell window (keep root window open as backup):
```powershell
ssh deploy@YOUR_SERVER_IP
```

### Step 5 — Install Security Tools

```bash
sudo apt install -y curl git ufw fail2ban unattended-upgrades
```

What each tool does:
- `curl` — makes HTTP requests from command line (used constantly)
- `git` — version control, for pulling code from GitHub
- `ufw` — Uncomplicated Firewall, controls which ports are accessible
- `fail2ban` — watches for repeated failed login attempts and bans those IPs automatically
- `unattended-upgrades` — automatically installs security patches

### Step 6 — Configure Firewall

**Why a firewall?**
Your server has 65,535 ports. Without a firewall, all of them are potentially accessible. We only need 3 — close everything else.

```bash
sudo ufw allow OpenSSH    # port 22 — so we can SSH in
sudo ufw allow 80         # HTTP web traffic
sudo ufw allow 443        # HTTPS secure web traffic
sudo ufw --force enable   # enable the firewall
sudo ufw status           # verify rules
```

**Port explanation:**
- Port 22 — SSH (how we control the server remotely)
- Port 80 — HTTP (normal web traffic)
- Port 443 — HTTPS (encrypted web traffic)

If you forget to allow SSH before enabling UFW, you'll lock yourself out permanently.

### Step 7 — Disable Root SSH Login

```bash
echo "PermitRootLogin no" | sudo tee /etc/ssh/sshd_config.d/50-cloud-init.conf
echo "PasswordAuthentication no" | sudo tee -a /etc/ssh/sshd_config.d/50-cloud-init.conf
sudo systemctl restart ssh
```

- `echo "..."` — creates the text
- `| sudo tee` — writes it to a file with admin privileges
- `-a` — append (add to end of file instead of overwriting)
- `systemctl restart ssh` — restart SSH service to apply changes

**Why disable password authentication?**
Passwords can be guessed or brute forced. SSH keys are 256 bits of randomness — practically impossible to guess. Disabling passwords means even if someone knows your username, they can't get in without your private key.

Verify root is blocked (should say Permission denied):
```powershell
ssh root@YOUR_SERVER_IP
```

### Step 8 — Install Docker

Docker lets us package our app and everything it needs into containers that run identically everywhere.

Add Docker's official repository (Ubuntu doesn't have the latest Docker by default):
```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

- `install -m 0755 -d` — create directory with specific permissions
- `curl -fsSL` — download quietly, follow redirects, fail on errors
- `gpg --dearmor` — convert GPG key to binary format Docker needs
- `chmod a+r` — make the key readable by all users

Add Docker's repository to Ubuntu's software sources:
```bash
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

This tells Ubuntu: "there's software at download.docker.com, trust it because it's signed with that GPG key we just added"

Update and install Docker:
```bash
sudo apt update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

- `docker-ce` — Docker engine (ce = community edition, free)
- `docker-ce-cli` — command line interface
- `containerd.io` — low-level runtime that actually runs containers
- `docker-buildx-plugin` — for building images
- `docker-compose-plugin` — for running multiple containers together

Let deploy user run Docker without sudo:
```bash
sudo usermod -aG docker deploy
newgrp docker
```

Verify Docker works:
```bash
docker run hello-world
```

### Phase 1 Complete — Security Checklist

- ✅ Non-root user created
- ✅ SSH key authentication only
- ✅ Root SSH login blocked
- ✅ Password authentication disabled
- ✅ Firewall active (only ports 22, 80, 443 open)
- ✅ Fail2ban installed (brute force protection)
- ✅ Auto security updates enabled
- ✅ Docker installed

### Automation Script for Phase 1

If you're rebuilding from scratch, run this as root on a fresh server:

```bash
cat > setup.sh << 'EOF'
#!/bin/bash
set -e

echo "Updating system..."
apt update && apt upgrade -y

echo "Installing essentials..."
apt install -y curl git ufw fail2ban unattended-upgrades ca-certificates gnupg

echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

echo "Installing Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list
apt update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "Creating deploy user..."
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
usermod -aG docker deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

echo "Securing SSH..."
echo "PermitRootLogin no" | tee /etc/ssh/sshd_config.d/50-cloud-init.conf
echo "PasswordAuthentication no" | tee -a /etc/ssh/sshd_config.d/50-cloud-init.conf
systemctl restart ssh

echo "Server ready!"
EOF

bash setup.sh
```

---

## Phase 2 — Building the Application

### Project Structure

```
taskapp/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   ├── .env              (never commit this)
│   ├── .gitignore
│   ├── Dockerfile
│   ├── database/
│   │   └── db.go
│   ├── models/
│   │   └── task.go
│   └── handlers/
│       └── tasks.go
├── frontend/
│   ├── src/
│   │   └── App.jsx
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── nginx.conf
└── .github/
    └── workflows/
        └── deploy.yml
```

### How Engineers Think About App Structure

Before writing code, engineers define:

1. **What data do we need?** → A task has: id, title, completed status, created timestamp
2. **What operations do we need?** → Create task, read all tasks, update task (toggle complete), delete task — this is called CRUD (Create, Read, Update, Delete)
3. **What endpoints expose these operations?** → REST API conventions:
   - `GET /tasks` → get all tasks
   - `POST /tasks` → create a task
   - `PUT /tasks/:id` → update a task
   - `DELETE /tasks/:id` → delete a task
4. **How does data flow?** → Browser → React → HTTP request → Go API → PostgreSQL → response back

### Backend Setup

Initialize Go module (on your local machine in the backend folder):
```powershell
cd D:\taskapp\backend
go mod init taskapp
```

`go mod init taskapp` creates `go.mod` — Go's dependency manager file. Like `package.json` in Node.js. Every Go project starts with this.

Install dependencies:
```powershell
go get github.com/gin-gonic/gin       # web framework
go get gorm.io/gorm                    # ORM (database abstraction)
go get gorm.io/driver/postgres         # PostgreSQL driver for GORM
go get github.com/joho/godotenv        # reads .env files
go get github.com/gin-contrib/cors     # handles CORS
```

**What is Gin?**
Go has a built-in HTTP server but it's very basic. Gin is a framework that adds routing, middleware, and JSON handling on top. Like Express.js for Node.

**What is GORM?**
Instead of writing raw SQL like `SELECT * FROM tasks`, GORM lets you write Go code like `db.Find(&tasks)`. It translates Go code to SQL automatically. Reduces errors and speeds up development.

**What is an ORM?**
ORM = Object Relational Mapper. It maps your Go structs (objects) to database tables (relations). A struct field becomes a database column.

### The Model — `models/task.go`

```go
package models

import "time"

type Task struct {
    ID        uint      `json:"id" gorm:"primaryKey"`
    Title     string    `json:"title" gorm:"not null"`
    Completed bool      `json:"completed" gorm:"default:false"`
    CreatedAt time.Time `json:"created_at"`
}
```

Line by line:

`package models` — this file belongs to the "models" package. In Go, files are organized into packages. Files in the same folder share a package name.

`import "time"` — brings in Go's time package so we can use `time.Time` type.

`type Task struct` — defines a new data type called Task. A struct is like a blueprint that describes what fields something has. Similar to a class in other languages.

`ID uint` — every task has a unique ID. `uint` means unsigned integer (positive whole numbers only, since IDs are never negative).

`Title string` — the task's text content.

`Completed bool` — true or false. Is the task done?

`CreatedAt time.Time` — when the task was created. Stored as a timestamp.

**What are the backtick tags?**
The text in backticks (`` ` ``) after each field are called struct tags. They add metadata:

- `` `json:"id"` `` — when converting to JSON, use "id" as the key (lowercase)
- `` `gorm:"primaryKey"` `` — tells GORM this is the primary key (unique identifier)
- `` `gorm:"not null"` `` — this field is required in the database
- `` `gorm:"default:false"` `` — new tasks start as not completed

### The Database Connection — `database/db.go`

```go
package database

import (
    "log"
    "os"

    "github.com/joho/godotenv"
    "gorm.io/driver/postgres"
    "gorm.io/gorm"
    "taskapp/models"
)

var DB *gorm.DB

func Connect() {
    godotenv.Load()

    dsn := os.Getenv("DATABASE_URL")
    if dsn == "" {
        log.Fatal("DATABASE_URL environment variable not set")
    }

    db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }

    db.AutoMigrate(&models.Task{})

    DB = db
    log.Println("Database connected successfully")
}
```

Line by line:

`var DB *gorm.DB` — a global variable that holds the database connection. The `*` means it's a pointer (it points to the memory location of the connection). Any file in the app can import this and use `database.DB` to query the database.

`func Connect()` — a function we call once at startup to establish the database connection.

`godotenv.Load()` — reads the `.env` file and loads all KEY=VALUE pairs as environment variables. This is how we avoid hardcoding passwords in code.

`os.Getenv("DATABASE_URL")` — reads the DATABASE_URL environment variable we just loaded.

`if dsn == ""` — if DATABASE_URL wasn't set, crash immediately with a clear error. Better to fail fast with a clear message than fail later with a confusing error.

`gorm.Open(postgres.Open(dsn), &gorm.Config{})` — open a connection to PostgreSQL using our connection string.

`db, err` — Go doesn't have try/catch. Functions return an error value. If something goes wrong, `err` will not be nil (nil means "nothing" in Go).

`log.Fatal` — print the error and exit the program immediately. If we can't reach the database, there's no point running.

`db.AutoMigrate(&models.Task{})` — GORM reads your Task struct and automatically creates the `tasks` table in PostgreSQL with the right columns. You never write `CREATE TABLE` SQL manually. When you add a field to the struct, AutoMigrate adds the column automatically.

`DB = db` — save the connection to our global variable so the rest of the app can use it.

### The Handlers — `handlers/tasks.go`

```go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "taskapp/database"
    "taskapp/models"
)

func GetTasks(c *gin.Context) {
    var tasks []models.Task
    database.DB.Find(&tasks)
    c.JSON(http.StatusOK, tasks)
}

func CreateTask(c *gin.Context) {
    var task models.Task
    if err := c.ShouldBindJSON(&task); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    database.DB.Create(&task)
    c.JSON(http.StatusCreated, task)
}

func UpdateTask(c *gin.Context) {
    var task models.Task
    if err := database.DB.First(&task, c.Param("id")).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
        return
    }
    task.Completed = !task.Completed
    database.DB.Save(&task)
    c.JSON(http.StatusOK, task)
}

func DeleteTask(c *gin.Context) {
    var task models.Task
    if err := database.DB.First(&task, c.Param("id")).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
        return
    }
    database.DB.Delete(&task)
    c.JSON(http.StatusOK, gin.H{"message": "Task deleted"})
}
```

`c *gin.Context` — every handler receives a context object. It contains everything about the incoming request (headers, body, URL params) and methods to send responses.

`GetTasks` — handles `GET /tasks`. Creates an empty slice (list) of tasks, GORM finds all tasks and fills the slice, return as JSON with status 200.

`var tasks []models.Task` — `[]` means slice (dynamic array). This creates an empty list of Task objects.

`database.DB.Find(&tasks)` — `&tasks` passes a pointer to the slice. GORM fills it with data from the database and returns the result through the pointer.

`c.JSON(http.StatusOK, tasks)` — send JSON response. `http.StatusOK` is just the number 200 written as a readable constant.

`CreateTask` — handles `POST /tasks`. `ShouldBindJSON` reads the request body and maps JSON keys to struct fields automatically. If the JSON is invalid, return 400 Bad Request.

`UpdateTask` — handles `PUT /tasks/:id`. First finds the task (404 if not found), then flips completed from false to true or true to false using `!task.Completed` (! means NOT in programming).

`c.Param("id")` — extracts the `:id` from the URL. If someone calls `DELETE /tasks/5`, this returns the string `"5"`.

`DeleteTask` — finds the task, deletes it, returns success message.

HTTP status codes used:
- 200 OK — success, returning data
- 201 Created — success, something was created
- 400 Bad Request — client sent invalid data
- 404 Not Found — requested resource doesn't exist

### Main Entry Point — `main.go`

```go
package main

import (
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "taskapp/database"
    "taskapp/handlers"
)

func main() {
    database.Connect()

    r := gin.Default()

    r.Use(cors.New(cors.Config{
        AllowOrigins: []string{"http://localhost:5173"},
        AllowMethods: []string{"GET", "POST", "PUT", "DELETE"},
        AllowHeaders: []string{"Content-Type"},
    }))

    r.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "ok"})
    })

    tasks := r.Group("/tasks")
    {
        tasks.GET("", handlers.GetTasks)
        tasks.POST("", handlers.CreateTask)
        tasks.PUT("/:id", handlers.UpdateTask)
        tasks.DELETE("/:id", handlers.DeleteTask)
    }

    r.Run(":8080")
}
```

`database.Connect()` — first thing we do is connect to the database. If it fails, the app crashes here with a clear error.

`gin.Default()` — creates a Gin router with default middleware (logging and crash recovery).

`r.Use(cors.New(...))` — middleware that runs on EVERY request before it hits handlers. Adds CORS headers.

**What is CORS?**
CORS = Cross-Origin Resource Sharing. Browsers block requests between different origins (different domains or ports) for security. React on port 5173 and Go on port 8080 are different origins. Without CORS headers, the browser refuses to let React talk to the Go API. Adding `AllowOrigins: ["http://localhost:5173"]` tells the browser "this is allowed".

`r.Group("/tasks")` — groups all task routes under the `/tasks` prefix. Cleaner than writing `/tasks` on every route.

`r.Run(":8080")` — start the server on port 8080.

### Environment Variables — `backend/.env`

```
DATABASE_URL=postgres://taskuser:taskpass@127.0.0.1:5433/taskdb?sslmode=disable
```

**Why environment variables instead of hardcoding?**
If you put your database password in code and push to GitHub, it's public forever. Even if you delete it later, it's in git history. Environment variables keep secrets out of code. The `.env` file is added to `.gitignore` so it never gets committed.

The connection string format:
```
postgres://USERNAME:PASSWORD@HOST:PORT/DATABASE?sslmode=disable
```

### Frontend — `frontend/src/App.jsx`

```jsx
import { useState, useEffect } from "react"
import axios from "axios"

const API = ""  // empty = use same origin (goes through Nginx in production)

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState("")

  useEffect(() => {
    fetchTasks()
    const interval = setInterval(() => {
      fetchTasks()
    }, 3000)
    return () => clearInterval(interval)
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
      <h1>Task Manager 🚀</h1>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createTask()}
          placeholder="Add a new task..."
          style={{ flex: 1, padding: "8px", fontSize: "16px" }}
        />
        <button onClick={createTask} style={{ padding: "8px 16px" }}>Add</button>
      </div>
      {tasks.length === 0 && <p>No tasks yet. Add one above!</p>}
      {tasks.map(task => (
        <div key={task.id} style={{
          display: "flex", alignItems: "center", gap: "8px",
          padding: "12px", marginBottom: "8px",
          border: "1px solid #ddd", borderRadius: "4px"
        }}>
          <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} />
          <span style={{
            flex: 1,
            textDecoration: task.completed ? "line-through" : "none",
            color: task.completed ? "#999" : "#000"
          }}>
            {task.title}
          </span>
          <button onClick={() => deleteTask(task.id)} style={{ color: "red" }}>Delete</button>
        </div>
      ))}
    </div>
  )
}

export default App
```

`useState([])` — React's way of storing data that can change. When `setTasks` is called, React re-renders the component with the new data.

`useEffect(() => {...}, [])` — runs once when the component first loads (the `[]` empty array means "run only on mount"). Sets up polling.

`setInterval(() => fetchTasks(), 3000)` — calls fetchTasks every 3000ms (3 seconds). This is polling — repeatedly checking for new data. Simpler than WebSockets but uses more server resources.

`return () => clearInterval(interval)` — cleanup function. When the component unmounts, stop the interval. Prevents memory leaks.

`const API = ""` — empty string means URLs become relative. `/tasks` instead of `http://localhost:8080/tasks`. In production everything goes through Nginx on port 80, so relative URLs just work.

### Dockerfiles

**What is Docker?**
Docker packages your app and everything it needs to run into a container — a self-contained, portable unit. The same container runs identically on your laptop, your server, AWS, anywhere. Solves "it works on my machine" forever.

**backend/Dockerfile:**
```dockerfile
FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -o main .

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]
```

Line by line:

`FROM golang:1.26-alpine AS builder` — start with an official Go image from Docker Hub. `alpine` is a tiny Linux distribution (5MB vs 200MB for Ubuntu). `AS builder` names this stage so we can reference it later.

`WORKDIR /app` — all subsequent commands run in the `/app` directory inside the container.

`COPY go.mod go.sum ./` — copy dependency files BEFORE copying code. Why? Docker caches layers. If only your code changed (not dependencies), Docker reuses the cached download step. Saves minutes on every build.

`RUN go mod download` — download all Go dependencies.

`COPY . .` — now copy all source code.

`RUN go build -o main .` — compile Go code into a single binary called `main`. Go compiles to a standalone executable with no runtime dependencies.

`FROM alpine:latest` — START FRESH. This is a multi-stage build. We throw away the Go compiler (300MB) and start with just Alpine Linux (5MB).

`COPY --from=builder /app/main .` — copy only the compiled binary from the builder stage.

`EXPOSE 8080` — documents that this container listens on port 8080.

`CMD ["./main"]` — command to run when the container starts.

**Result: ~15MB image instead of ~300MB. Multi-stage builds are best practice.**

**frontend/Dockerfile:**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

`RUN npm run build` — Vite compiles React into pure static HTML/CSS/JavaScript in a `/dist` folder. No Node.js or React needed to serve these files — just a web server.

`FROM nginx:alpine` — second stage, just Nginx.

`COPY --from=builder /app/dist /usr/share/nginx/html` — copy built files to Nginx's default serving directory.

`CMD ["nginx", "-g", "daemon off;"]` — start Nginx in foreground mode. `daemon off` keeps Nginx as the main process so Docker knows the container is alive.

### docker-compose.yml

```yaml
version: "3.8"

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_USER: taskuser
      POSTGRES_PASSWORD: taskpass
      POSTGRES_DB: taskdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - tasknet
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskuser -d taskdb"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://taskuser:taskpass@db:5432/taskdb?sslmode=disable
    depends_on:
      db:
        condition: service_healthy
    networks:
      - tasknet
    deploy:
      replicas: 3

  frontend:
    build: ./frontend
    networks:
      - tasknet
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - frontend
    networks:
      - tasknet

volumes:
  postgres_data:

networks:
  tasknet:
```

Key concepts:

`healthcheck` — Docker repeatedly runs `pg_isready` (PostgreSQL's built-in readiness check tool) every 5 seconds. The db service is only considered "healthy" when this passes.

`condition: service_healthy` — backend won't start until db passes the health check. Without this, backend starts immediately and tries to connect to a database that isn't ready yet — causing it to crash.

`volumes: postgres_data:/var/lib/postgresql/data` — maps a persistent Docker volume to PostgreSQL's data directory. Without this, all data is lost when the container restarts.

`networks: tasknet` — all services on the same private Docker network. Containers find each other by service name. `db` resolves to the database container's IP automatically — no IP addresses needed.

`deploy: replicas: 3` — run 3 identical copies of the backend.

`/etc/letsencrypt:/etc/letsencrypt:ro` — mount SSL certificates from the host into the Nginx container. `:ro` means read-only.

---

## Phase 3 — Nginx Reverse Proxy + HTTPS

### What is a Reverse Proxy?

A proxy acts on behalf of someone else. A **forward proxy** sits in front of clients (like a VPN). A **reverse proxy** sits in front of servers.

Think of a hotel receptionist. Guests don't go directly to the kitchen, housekeeping, or manager. They go to the receptionist who routes them to the right department. Nginx is your receptionist.

**Without Nginx:**
```
Browser needs to know:
- React is on port 3000
- Go API is on port 8080
- User has to know these ports
```

**With Nginx:**
```
Browser only knows: yourdomain.com (port 80/443)
Nginx decides: / → frontend, /tasks → backend
```

### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server taskapp-backend-1:8080;
        server taskapp-backend-2:8080;
        server taskapp-backend-3:8080;
    }

    server {
        listen 80;
        server_name yourdomain.duckdns.org;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
        server_name yourdomain.duckdns.org;

        ssl_certificate /etc/letsencrypt/live/yourdomain.duckdns.org/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.duckdns.org/privkey.pem;

        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /tasks {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /health {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

`events { worker_connections 1024 }` — how many simultaneous connections Nginx handles. 1024 is fine for moderate traffic.

`upstream backend` — defines a group of backend servers for load balancing. Nginx distributes requests across all servers in the group using round-robin by default.

`listen 80; return 301` — redirect ALL HTTP traffic to HTTPS. 301 is a permanent redirect. The browser remembers and automatically uses HTTPS next time.

`listen 443 ssl` — handle HTTPS connections on port 443.

`ssl_certificate` — path to the certificate file (public key + certificate chain).

`ssl_certificate_key` — path to the private key.

`location /` — any URL starting with `/` goes to the frontend container.

`location /tasks` — any URL starting with `/tasks` goes to the backend upstream group (load balanced across all 3 instances).

`proxy_set_header Host $host` — pass the original hostname to backend so it knows what domain was requested.

`proxy_set_header X-Real-IP $remote_addr` — pass the real client IP. Without this, your backend would see Nginx's IP (172.18.0.x) instead of the actual user's IP.

### Setting Up Free SSL with Let's Encrypt

**What is Let's Encrypt?**
A free, non-profit Certificate Authority. Before 2016, SSL certificates cost $50-$200/year. Let's Encrypt made HTTPS free for everyone. Certbot is the official tool.

Install Certbot:
```bash
sudo apt install -y certbot
```

Stop Nginx temporarily (Certbot needs port 80 to verify domain ownership):
```bash
cd ~/taskapp
docker compose stop nginx
```

Get certificate:
```bash
sudo certbot certonly --standalone -d yourdomain.duckdns.org
```

- `certonly` — get certificate but don't configure any web server (we configure Nginx ourselves)
- `--standalone` — Certbot runs its own temporary web server on port 80
- `-d yourdomain.duckdns.org` — the domain to certify

**How domain verification works:**
1. Certbot tells Let's Encrypt "I want a certificate for yourdomain.duckdns.org"
2. Let's Encrypt sends a challenge: "put this random string at http://yourdomain.duckdns.org/.well-known/acme-challenge/XXXXX"
3. Certbot's temporary web server responds with the correct string
4. Let's Encrypt verifies it, proves you control the domain
5. Certificate issued

Certificates are saved at:
- `/etc/letsencrypt/live/yourdomain.duckdns.org/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.duckdns.org/privkey.pem`

They expire every 90 days but Certbot automatically sets up a cron job to renew them.

### Free Domain with DuckDNS

DuckDNS gives you free subdomains like `yourname.duckdns.org`. Sign in at duckdns.org, create a subdomain, point it to your server IP. No payment, no registration — works with Let's Encrypt SSL.

---

## Phase 4 — CI/CD Pipeline

### The Problem

Manual deployment process:
1. Change code on PC
2. git push
3. SSH into server
4. git pull
5. docker compose up --build -d
6. Wait
7. Hope nothing broke

7 steps every single time. If you deploy 10 times a day, that's exhausting and error-prone.

### The Solution — GitHub Actions

GitHub Actions runs automated workflows triggered by git events. When you push code, GitHub spins up a fresh Ubuntu VM on their servers, runs your workflow steps, and in our case SSHs into your server to deploy.

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd ~/taskapp
            git pull origin main
            docker compose up --build -d
            docker image prune -f
```

`on: push: branches: main` — trigger this workflow whenever code is pushed to the main branch.

`runs-on: ubuntu-latest` — GitHub provides a free Ubuntu VM to run this workflow.

`actions/checkout@v3` — official GitHub action that clones your repository onto the runner VM.

`appleboy/ssh-action@v1.0.0` — community action that SSHs into a remote server and runs commands. This is the key step.

`${{ secrets.SERVER_HOST }}` — reads a secret stored in GitHub. Never put actual values in the workflow file.

`script` — commands to run on YOUR server:
- `cd ~/taskapp` — go to app directory
- `git pull origin main` — fetch latest code
- `docker compose up --build -d` — rebuild and restart containers in background
- `docker image prune -f` — delete unused Docker images to save disk space

### Setting Up GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `SERVER_HOST` — your server's IP address
- `SERVER_USER` — `deploy`
- `SERVER_SSH_KEY` — contents of `~/.ssh/id_ed25519` (your PRIVATE key)

To get your private key:
```powershell
cat $env:USERPROFILE\.ssh\id_ed25519
```

Copy the entire output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

### CI/CD vs Jenkins

| | GitHub Actions | Jenkins |
|---|---|---|
| Where it runs | GitHub's servers | Your own server |
| Cost | Free (2000 min/month) | Free but needs a server |
| Setup | Just a .yml file | Install, configure, maintain |
| Best for | Startups, small-mid teams | Large enterprises |
| Modern? | Yes, industry moving here | Older but battle-tested |

GitHub Actions is production-grade for most companies. Jenkins is common in large enterprises that built around it years ago.

---

## Phase 5 — Monitoring & Logging

### Metrics vs Logs

**Metrics** — numbers measured over time.
```
CPU: 23%
RAM: 1.2GB used
Requests/second: 45
Response time: 120ms
```
Metrics tell you WHAT is happening and HOW MUCH.

**Logs** — text records of events with timestamps.
```
2026-06-04 14:33:47 | 200 | 2ms | 175.157.10.153 | GET "/tasks"
2026-06-04 14:33:52 | 201 | 5ms | 175.157.10.153 | POST "/tasks"
```
Logs tell you WHAT HAPPENED and WHY it broke.

**You need both.** Metrics trigger the alert. Logs explain the cause.

### The Monitoring Stack

Create `~/monitoring/` directory with its own `docker-compose.yml`:

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
    networks:
      - monitoring

  loki:
    image: grafana/loki:latest
    volumes:
      - loki_data:/loki
    networks:
      - monitoring

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
      - ./promtail.yml:/etc/promtail/config.yml
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=your_secure_password_here
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring

volumes:
  prometheus_data:
  loki_data:
  grafana_data:

networks:
  monitoring:
```

**prometheus.yml:**
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

`scrape_interval: 15s` — collect metrics from all targets every 15 seconds.

`storage.tsdb.retention.time=15d` — keep 15 days of data. Older data is automatically deleted to save disk space.

Node Exporter mounts `/proc` and `/sys` — these are special Linux virtual filesystems that expose kernel data (CPU, memory, disk, network) as files. Node Exporter reads these files and exposes them as metrics Prometheus can scrape.

**promtail.yml:**
```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: container
      - source_labels: ['__meta_docker_container_log_stream']
        target_label: stream
```

`docker_sd_configs` — Promtail connects to Docker socket and automatically discovers all running containers. When a new container starts, Promtail immediately starts collecting its logs.

`relabel_configs` — transforms raw metadata into useful labels. `__meta_docker_container_name` gives us the container name which we relabel as `container`. This lets us filter logs by container name in Grafana.

Open port 3000 for Grafana:
```bash
sudo ufw allow 3000
```

### Setting Up Grafana

Access at `http://YOUR_SERVER_IP:3000`

Login: admin / your_secure_password_here

Add data sources:
1. Connections → Data sources → Add → Prometheus → URL: `http://prometheus:9090` → Save & test
2. Connections → Data sources → Add → Loki → URL: `http://loki:3100` → Save & test

Import pre-built server dashboard:
- Dashboards → New → Import → ID: `1860` → Load → Import
- This gives you CPU, RAM, disk, network graphs instantly

Query your app logs in Explore:
```
{service_name="taskapp-backend-1"}
```

### Reading Logs

```
2026-06-04 19:13:18 | [GIN] | 200 | 1.63ms | 175.157.10.153 | PUT "/tasks/11"
```

- `2026-06-04 19:13:18` — timestamp
- `[GIN]` — came from Gin framework
- `200` — HTTP status (200 = success)
- `1.63ms` — request processing time
- `175.157.10.153` — client IP address
- `PUT "/tasks/11"` — what they did (completed task #11)

Log levels:
- `debug` — detailed dev info, ignore in production
- `info` — normal operations, nothing urgent
- `warn` — unexpected but not breaking
- `error` — something failed, investigate
- `fatal` — app is crashing, emergency

---

## Phase 6 — Scaling & Load Balancing

### Horizontal vs Vertical Scaling

**Vertical scaling** — make the server bigger (more CPU, more RAM). Simple but has limits and requires downtime.

**Horizontal scaling** — run more instances of your app. More flexible, can scale indefinitely.

We use horizontal scaling — run 3 backend containers instead of 1.

### How Load Balancing Works

Nginx upstream with round-robin:

```
Request 1 → backend-1
Request 2 → backend-2
Request 3 → backend-3
Request 4 → backend-1  (cycle repeats)
```

Like dealing cards — one to each player, repeat. Every backend gets equal traffic.

Other load balancing strategies:
- `least_conn` — send to instance with fewest active connections
- `ip_hash` — same IP always goes to same backend (useful for session stickiness)

In docker-compose.yml:
```yaml
deploy:
  replicas: 3
```

Docker creates `taskapp-backend-1`, `taskapp-backend-2`, `taskapp-backend-3` automatically.

In nginx.conf:
```nginx
upstream backend {
    server taskapp-backend-1:8080;
    server taskapp-backend-2:8080;
    server taskapp-backend-3:8080;
}
```

`proxy_pass http://backend;` now sends to the group, Nginx picks which server.

### Why All Backends Share One Database

Multiple backends connecting to one PostgreSQL is perfectly safe. PostgreSQL handles concurrent connections natively using internal locking — two requests can't corrupt the same data simultaneously.

This is why we have one `db` service but three `backend` services.

### Verifying Load Balancing

```bash
for i in {1..9}; do curl -sk https://localhost/health; echo; done
docker logs taskapp-backend-1 --tail 5
docker logs taskapp-backend-2 --tail 5
docker logs taskapp-backend-3 --tail 5
```

Each backend should show exactly 3 requests — perfect round robin.

---

## Phase 7 — Backups & Disaster Recovery

### Why Backups Are Critical

Everything else can be recreated:
- Server config → run the setup script
- App code → it's on GitHub
- Docker configs → they're on GitHub

But database data is ONLY on the server. Without backups, if the server dies, data is gone forever.

### The Backup Script

```bash
#!/bin/bash

DB_CONTAINER="taskapp-db-1"
DB_USER="taskuser"
DB_NAME="taskdb"
S3_BUCKET="s3://your-bucket-name"
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

echo "Creating backup..."
docker exec $DB_CONTAINER pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/$BACKUP_FILE

echo "Uploading to S3..."
aws s3 cp $BACKUP_DIR/$BACKUP_FILE $S3_BUCKET/$BACKUP_FILE

echo "Cleaning up..."
rm $BACKUP_DIR/$BACKUP_FILE

echo "Removing old backups (30+ days)..."
aws s3 ls $S3_BUCKET/ | while read -r line; do
    createDate=$(echo $line | awk '{print $1}')
    createDate=$(date -d "$createDate" +%s)
    olderThan=$(date -d "30 days ago" +%s)
    if [[ $createDate -lt $olderThan ]]; then
        fileName=$(echo $line | awk '{print $4}')
        aws s3 rm $S3_BUCKET/$fileName
    fi
done

echo "Backup completed: $BACKUP_FILE"
```

`pg_dump` — PostgreSQL's built-in backup tool. Exports the entire database as SQL commands that can recreate it from scratch.

`| gzip` — pipe through gzip compression. Reduces file size by ~90%.

`aws s3 cp` — upload to S3 using AWS CLI.

`rm` — delete local copy after uploading. No point keeping it on the server.

The 30-day retention loop — lists all S3 objects, checks creation date, deletes anything older than 30 days. Keeps costs minimal.

### Automate with Cron

```bash
crontab -e
```

Add:
```
0 2 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1
```

Cron syntax breakdown:
```
0  2  *  *  *
│  │  │  │  └── day of week (0-7, * = any)
│  │  │  └───── month (* = any)
│  │  └──────── day of month (* = any)
│  └─────────── hour (2 = 2am)
└────────────── minute (0 = at :00)
```

`>> /home/deploy/backup.log` — append output to log file so you can check if backups succeeded.

`2>&1` — redirect stderr (errors) to stdout, so both go to the log file.

### Restore Procedure

In a disaster scenario:

```bash
# 1. Download backup from S3
aws s3 cp s3://your-bucket/backup_DATE.sql.gz ~/restore.sql.gz

# 2. Stop the app
cd ~/taskapp
docker compose down

# 3. Delete old database volume
docker volume rm taskapp_postgres_data

# 4. Start only the database
docker compose up -d db

# 5. Wait for it to be ready
sleep 15

# 6. Decompress and restore
gunzip ~/restore.sql.gz
cat ~/restore.sql | docker exec -i taskapp-db-1 psql -U taskuser -d taskdb

# 7. Start everything
docker compose up -d

echo "Restore complete!"
```

**Always test your restore procedure before you need it.** A backup you've never tested is a backup you can't trust.

---

## Quick Recreation Scripts

### Complete Server Setup (run as root on fresh Ubuntu 24.04)

```bash
#!/bin/bash
set -e

echo "=== Phase 1: System Setup ==="
apt update && apt upgrade -y
apt install -y curl git ufw fail2ban unattended-upgrades ca-certificates gnupg

echo "=== Firewall ==="
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

echo "=== Docker ==="
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list
apt update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "=== Deploy User ==="
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
usermod -aG docker deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

echo "=== SSH Security ==="
echo "PermitRootLogin no" | tee /etc/ssh/sshd_config.d/50-cloud-init.conf
echo "PasswordAuthentication no" | tee -a /etc/ssh/sshd_config.d/50-cloud-init.conf
systemctl restart ssh

echo "=== AWS CLI ==="
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
apt install -y unzip
unzip awscliv2.zip
./aws/install

echo "=== Done! SSH in as deploy user now ==="
```

### App Deployment (run as deploy user)

```bash
#!/bin/bash
set -e

echo "=== Cloning App ==="
git clone https://github.com/YOUR_USERNAME/taskapp.git ~/taskapp
cd ~/taskapp

echo "=== Starting App ==="
docker compose up --build -d

echo "=== App is running! ==="
docker compose ps
```

### SSL Certificate Setup

```bash
#!/bin/bash
DOMAIN="yourdomain.duckdns.org"

# Stop nginx temporarily
cd ~/taskapp
docker compose stop nginx

# Get certificate
sudo certbot certonly --standalone -d $DOMAIN

# Restart nginx
docker compose start nginx

echo "SSL certificate installed for $DOMAIN"
echo "Certificate expires: $(sudo certbot certificates | grep Expiry)"
```

### Monitoring Stack Setup

```bash
#!/bin/bash
mkdir -p ~/monitoring
cd ~/monitoring

# Create prometheus.yml
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
EOF

# Create promtail.yml
cat > promtail.yml << 'EOF'
server:
  http_listen_port: 9080
positions:
  filename: /tmp/positions.yaml
clients:
  - url: http://loki:3100/loki/api/v1/push
scrape_configs:
  - job_name: docker
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: container
EOF

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: "3.8"
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=15d'
    networks:
      - monitoring
  node-exporter:
    image: prom/node-exporter:latest
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
    networks:
      - monitoring
  loki:
    image: grafana/loki:latest
    volumes:
      - loki_data:/loki
    networks:
      - monitoring
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock
      - ./promtail.yml:/etc/promtail/config.yml
    networks:
      - monitoring
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=changeme123
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring
volumes:
  prometheus_data:
  loki_data:
  grafana_data:
networks:
  monitoring:
EOF

sudo ufw allow 3000
docker compose up -d
echo "Monitoring running at http://YOUR_SERVER_IP:3000"
```

### Backup Setup

```bash
#!/bin/bash
S3_BUCKET="s3://your-bucket-name"

cat > ~/backup.sh << EOF
#!/bin/bash
DB_CONTAINER="taskapp-db-1"
DB_USER="taskuser"
DB_NAME="taskdb"
S3_BUCKET="$S3_BUCKET"
BACKUP_DIR="/home/deploy/backups"
DATE=\$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backup_\$DATE.sql.gz"

mkdir -p \$BACKUP_DIR
docker exec \$DB_CONTAINER pg_dump -U \$DB_USER \$DB_NAME | gzip > \$BACKUP_DIR/\$BACKUP_FILE
aws s3 cp \$BACKUP_DIR/\$BACKUP_FILE \$S3_BUCKET/\$BACKUP_FILE
rm \$BACKUP_DIR/\$BACKUP_FILE
echo "Backup completed: \$BACKUP_FILE"
EOF

chmod +x ~/backup.sh

# Add to cron (runs at 2am daily)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/deploy/backup.sh >> /home/deploy/backup.log 2>&1") | crontab -

echo "Backup automation configured!"
echo "Test it with: ~/backup.sh"
```

---

## AI Prompt to Recreate This

Use this prompt with any AI assistant to recreate this entire project:

---

```
I want to build and deploy a production-grade full stack web application from scratch on a raw VPS. Guide me through every step, explain every command before I run it, and explain why we're making each decision.

Here is what I want to build:

APPLICATION:
- Backend: Go (Golang) REST API using the Gin framework and GORM ORM
- Database: PostgreSQL
- Frontend: React with Vite and Axios for API calls
- App idea: a simple Task Manager with CRUD operations (create, read, update/toggle, delete tasks)

INFRASTRUCTURE:
- VPS: Hetzner Cloud (CX23 — 2 vCPU, 4GB RAM, Ubuntu 24.04)
- Containerization: Docker + Docker Compose
- Web server: Nginx as reverse proxy with SSL termination
- SSL: Let's Encrypt via Certbot (free)
- Domain: DuckDNS (free subdomain)

EVERYTHING I WANT TO IMPLEMENT:
1. Server security hardening (non-root user, SSH keys only, no passwords, UFW firewall, fail2ban)
2. Go backend with proper package structure (models/, handlers/, database/)
3. React frontend with polling for real-time updates
4. Multi-stage Dockerfiles for minimal image sizes
5. Docker Compose with health checks, named volumes, private networks
6. Nginx reverse proxy routing / to frontend and /tasks to backend
7. HTTPS with Let's Encrypt SSL certificate
8. GitHub Actions CI/CD pipeline that auto-deploys on git push to main
9. Monitoring stack: Prometheus + Node Exporter + Grafana + Loki + Promtail
10. Horizontal scaling with 3 backend replicas and Nginx load balancing (round-robin)
11. Automated PostgreSQL backups to AWS S3 with 30-day retention via cron job
12. Restore procedure documentation

MY SETUP:
- Windows PC with PowerShell
- VS Code for editing
- Docker Desktop installed
- Go installed
- Node.js installed
- GitHub account
- AWS account (for S3 backups free tier)

TEACHING APPROACH:
- Explain every command before I run it
- Explain WHY we're making each decision (what problem it solves)
- Explain what each line of code does
- Tell me when there are alternative approaches and why we chose this one
- Go phase by phase, wait for my confirmation before moving to next step
- When something goes wrong, explain what the error means and how to fix it
- Think out loud like an engineer — what could go wrong, why did we choose this tool

Start with Phase 1: Server Setup and Security. First help me generate an SSH key on my Windows machine, then guide me through creating the Hetzner server, and then securing it.
```

---

## Key Concepts Reference

| Concept | Simple Explanation |
|---|---|
| SSH Key | Padlock (public) on server + key (private) on your PC |
| UFW Firewall | Only ports 22, 80, 443 open. Everything else blocked |
| Docker Container | Your app + everything it needs in a portable box |
| Docker Image | Blueprint for a container (like a class) |
| Docker Compose | Conductor that runs multiple containers together |
| Nginx | Hotel receptionist — routes traffic to right place |
| Reverse Proxy | Sits in front of servers, hides complexity |
| SSL/HTTPS | Encrypts traffic between browser and server |
| CI/CD | Push code → automatically tested and deployed |
| Prometheus | Collects numbers (CPU %, requests/sec) every 15s |
| Grafana | Makes beautiful graphs from Prometheus data |
| Loki | Stores and searches log text |
| Promtail | Collects logs from containers, ships to Loki |
| Load Balancing | Distribute traffic across multiple servers equally |
| Round Robin | Request 1→server1, 2→server2, 3→server3, repeat |
| pg_dump | PostgreSQL's tool to export entire database as SQL |
| Cron Job | Scheduled task (like Windows Task Scheduler) |
| S3 | AWS's infinite file storage, very cheap |
| CORS | Browser security that blocks cross-origin requests |
| GORM | Converts Go structs to SQL queries automatically |
| AutoMigrate | Creates/updates database tables from Go structs |
| Healthcheck | Docker repeatedly checks if a service is ready |
| Multi-stage Build | Build in one image, copy result to smaller image |
| Named Volume | Persistent Docker storage that survives restarts |
| Private Network | Docker containers talk to each other by name |

---

## Final Architecture Summary

```
┌─────────────────────────────────────────────┐
│           Hetzner VPS (CX23)                │
│         2 vCPU / 4GB RAM / 40GB            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         Docker Network              │   │
│  │                                     │   │
│  │  ┌──────┐   ┌──────────────────┐   │   │
│  │  │Nginx │──▶│   frontend-1     │   │   │
│  │  │:80   │   │   (React/Nginx)  │   │   │
│  │  │:443  │   └──────────────────┘   │   │
│  │  │      │   ┌──────────────────┐   │   │
│  │  │      │──▶│   backend-1      │   │   │
│  │  │      │   │   backend-2      │──┐│   │
│  │  │      │   │   backend-3      │  ││   │
│  │  └──────┘   │   (Go API)       │  ││   │
│  │             └──────────────────┘  ││   │
│  │                                   ▼│   │
│  │             ┌──────────────────┐   │   │
│  │             │   PostgreSQL     │◀──┘│   │
│  │             │   (taskdb)       │    │   │
│  │             └──────────────────┘    │   │
│  └──────────────────────────────────── ┘   │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │      Monitoring (separate network)   │  │
│  │  Prometheus → Grafana ← Loki        │  │
│  │  Node Exporter    Promtail          │  │
│  └──────────────────────────────────── ┘  │
└─────────────────────────────────────────────┘
         │                    │
    GitHub Actions        AWS S3
    (auto deploy)      (daily backups)
```

**Total cost: ~$7.50/month**
**Total learning: priceless** 🚀
