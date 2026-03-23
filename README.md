# Lost & Found — Full Stack Project

## Project Structure
```
lost-and-found-website/
├── ai_service/        ← Python FastAPI AI microservice (port 8000)
├── backend/           ← Node.js Express API (port 5000)
├── frontend/          ← React app (port 3000)
├── database/          ← init.sql auto-runs on first Docker start
├── uploads/           ← uploaded item images
└── docker-compose.yml ← starts PostgreSQL + pgvector
```

## Prerequisites
Install these before anything else:
- [Docker Desktop](https://www.docker.com/products/docker-desktop) — start it after installing
- [Node.js 18+](https://nodejs.org) — check "Add to PATH"
- [Python 3.10 or 3.11](https://python.org) — check "Add to PATH" (NOT 3.13)

## Setup (do this once)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/lost-and-found-website.git
cd lost-and-found-website
```

### 2. Start the database
```bash
docker compose up -d
```
Wait 30 seconds. All tables are created automatically from database/init.sql.

### 3. Set up backend
```bash
cd backend
copy .env.example .env
npm install
```

### 4. Set up AI service
```bash
cd ../ai_service
copy .env.example .env
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```
First time takes 5-10 minutes — downloads AI models (~500MB).

### 5. Set up frontend
```bash
cd ../frontend
npm install
```

## Running the project (every time)
Open 3 terminals from the `lost-and-found-website` folder:

| Terminal | Commands | URL |
|----------|----------|-----|
| 1 — Backend | `cd backend` then `npm run dev` | localhost:5000 |
| 2 — AI Service | `cd ai_service` then `.venv\Scripts\activate` then `python main.py` | localhost:8000 |
| 3 — Frontend | `cd frontend` then `npm start` | localhost:3000 |