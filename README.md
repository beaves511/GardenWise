# Gardening App Monorepo

This project contains a Next.js frontend and a Flask backend with PostgreSQL (Supabase compatible) integration.

## Structure
- `frontend/` — Next.js (React, TypeScript, Tailwind CSS, ESLint)
- `backend/` — Flask API (SQLAlchemy, Flask-CORS, PostgreSQL)

---

## Setup Instructions

### Prerequisites
- Node.js (for frontend)
- Python 3.8+ (for backend)
- PostgreSQL database (Supabase or self-hosted)

---

### 1. Frontend (Next.js)

```sh
cd frontend
npm install
npm run dev
```
- Configure API URL in `.env` (see `.env.example`).

---

### 2. Backend (Flask)

```sh
cd backend
# (Optional) Create and activate a virtual environment
# python -m venv venv
# .\venv\Scripts\activate
pip install -r requirements.txt  # or install dependencies manually
python app.py
```
- Configure database URL in `.env` (see `.env.example`).
- Example: `DATABASE_URL=postgresql://username:password@host:port/database`

---

### 3. Database (PostgreSQL/Supabase)
- Create a database and user in Supabase or your own PostgreSQL instance.
- Update the backend `.env` with your connection string.
- To initialize tables, run in Python:
  ```python
  from app import db
  db.create_all()
  ```

---

## Communication
- The frontend communicates with the backend via HTTP API calls (CORS enabled).
- Update `NEXT_PUBLIC_API_URL` in the frontend `.env` to match your backend URL.

---

## Notes
- You can add or remove Tailwind, ESLint, or the `src` directory in the frontend as needed.
- The backend uses a virtual environment for dependency isolation (recommended).

---

## Environment Variables
- See `.env.example` files in both `frontend/` and `backend/` for required variables.

---

## Development
- Run frontend and backend servers separately during development.
- For production, consider deploying each service independently (e.g., Vercel for Next.js, Render/Heroku for Flask).
