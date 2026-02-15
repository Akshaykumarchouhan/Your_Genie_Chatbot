# Your Genie Chatbot

A full-stack AI chatbot web app where users can sign up, sign in, and chat with an AI assistant (powered by **Google Gemini**) that uses **Tavily Search** for real-time answers and source links. Includes chat history, token usage display, and PDF export.

---

## Features

- **Authentication** — Register and login; JWT-based sessions
- **AI Chat** — Ask questions and get answers in a ChatGPT-style format (headers, bullets, code blocks, tables)
- **Search-backed answers** — Tavily Search enriches responses with up-to-date web results
- **Source links** — Each reply can show real, clickable source URLs (blue links)
- **Chat history** — Left sidebar lists your past searches; click to recall and resend
- **Token balance** — Navbar shows remaining tokens (with animation when it decreases)
- **Export to PDF** — Export the current chat to a formatted PDF (bullets, sections, blue source links)

---

## Tech Stack

| Layer      | Stack |
|-----------|--------|
| **Frontend** | React 18, React Router, Axios, React Markdown + remark-gfm, jsPDF |
| **Backend**  | Node.js, Express 5, MongoDB (Mongoose), JWT, bcrypt |
| **AI & Search** | Google Gemini API, Tavily Search API |

---

## Project Structure

```
Your_Genie _Chatbot/
├── frontend/                 # React app
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/       # Login, Register, Chat, Navbar, HistorySidebar
│       ├── pages/           # LoginPage, ChatPage
│       ├── services/        # api.js (axios base URL)
│       ├── App.js
│       ├── index.js
│       └── styles.css
├── backend-node/
│   ├── config/
│   │   └── db.js            # MongoDB connection
│   ├── models/
│   │   └── User.js          # User schema (tokens_left, history)
│   ├── routes/
│   │   ├── auth.js          # POST /register, POST /login
│   │   └── chat.js          # POST /chat, GET /chat/history
│   ├── server.js
│   ├── test_flow.js         # Optional API test script
│   └── .env                 # See Environment Variables
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** (v16+)
- **MongoDB** (local or Atlas)
- **API keys**
  - [Google AI Studio](https://aistudio.google.com/) — Gemini API key
  - [Tavily](https://tavily.com/) — Search API key

---

## Environment Variables

Create `backend-node/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-genie
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
TAVILY_API_KEY=your-tavily-api-key
```

- **MONGODB_URI** — MongoDB connection string (use Atlas URI for production).
- **JWT_SECRET** — Strong random string for signing tokens.
- **GEMINI_API_KEY** — From Google AI Studio.
- **TAVILY_API_KEY** — From Tavily dashboard.

---

## Installation & Run (Local)

### 1. Clone the repo

```bash
git clone https://github.com/Akshaykumarchouhan/Your_Genie_Chatbot.git
cd Your_Genie_Chatbot
```

### 2. Backend

```bash
cd backend-node
npm install
# Add .env with MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, TAVILY_API_KEY
npm run dev
```

Server runs at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`.  
Default API base URL in `frontend/src/services/api.js` is set to the **deployed backend** (see below). For local backend, change it to `http://localhost:5000/api`.

---

## Deployed Backend

The backend is deployed on **Render**:

- **Base URL:** `https://your-genie-chatbot.onrender.com`
- **API base:** `https://your-genie-chatbot.onrender.com/api`

The frontend is configured to use this URL. Deploy the frontend (e.g. Vercel, Netlify) and ensure your backend CORS allows that origin.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/api/users/register` | Register (name, email, password) |
| POST   | `/api/users/login`     | Login (email, password) |
| POST   | `/api/chat`            | Send message (body: `{ prompt }`), header: `x-auth-token` |
| GET    | `/api/chat/history`    | Get current user’s chat history, header: `x-auth-token` |

---

## License

ISC.

---

**Your Genie** — Ask anything, get answers that shine.
