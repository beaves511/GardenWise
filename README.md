# Gardening App Monorepo

A full-featured gardening companion app with AI-powered garden planning, plant collection management, and community forum. Built with Next.js and Flask.

## Features

### Plant Management
- **Plant Search** - Search indoor and outdoor plants using RapidAPI and Perenual databases
- **Collections** - Organize plants into custom collections
- **Plant Details** - View detailed information about each plant

### AI Garden Planner
- **Smart Planning** - AI-powered garden layout recommendations using Google Gemini
- **Spatial Optimization** - Get customized planting plans based on your space and preferences
- **Plant Compatibility** - AI suggests companion planting strategies

### Community Forum
- **Discussion Threads** - Create and participate in gardening discussions
- **Nested Comments** - Threaded replies for organized conversations
- **Public Access** - Browse forum without account, sign in to post

### User Features
- **Authentication** - Secure sign up/sign in with Supabase Auth
- **Profile Management** - Update email and password
- **Personal Collections** - Create, rename, and delete plant collections
- **JWT Security** - Token-based authentication with ECC signatures

---

## Tech Stack

### Frontend
- **Next.js 15.5.4** with App Router (React 19.1.0)
- **TypeScript** & JavaScript
- **Tailwind CSS v4** with PostCSS
- **React Icons** for UI components
- **Jest & Testing Library** for testing

### Backend
- **Flask** Python web framework
- **Supabase** PostgreSQL database with Row Level Security
- **Flask-CORS** for cross-origin requests
- **PyJWT** with ECC key verification
- **pytest** for testing

### External Services
- **Supabase** - Database, authentication, RLS
- **Google Gemini API** - AI garden planning (gemini-2.5-flash-preview)
- **RapidAPI** - House Plants 2 API for indoor plants
- **Perenual API** - Outdoor plant database

---

## Project Structure

```
gardening-app/
├── frontend/          Next.js application
│   ├── app/           App Router pages
│   │   ├── auth/      Authentication pages
│   │   ├── collections/  Plant collections
│   │   ├── planner/   AI garden planner
│   │   ├── forum/     Community forum
│   │   ├── profile/   User profile
│   │   └── plants/    Plant details
│   ├── components/    Reusable UI components
│   └── lib/           Utilities and Supabase client
│
└── backend/           Flask API
    ├── routes/        Blueprint-based endpoints
    │   ├── auth.py    User authentication
    │   ├── collections.py  Collection management
    │   ├── plants.py  Plant search
    │   ├── ai.py      AI planning
    │   ├── forum.py   Forum posts/comments
    │   └── profile.py User profile
    ├── services/      Business logic layer
    └── app.py         Main application entry
```

---

## Setup Instructions

### Prerequisites
- **Node.js 18+** (for frontend)
- **Python 3.8+** (for backend)
- **Supabase Account** (for database & auth)
- **API Keys** (Google Gemini, RapidAPI, Perenual)

---

### 1. Frontend Setup

```sh
cd frontend
npm install
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run development server:
```sh
npm run dev
```

Frontend runs on `http://localhost:3000`

---

### 2. Backend Setup

```sh
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

Create `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_key
RAPIDAPI_KEY=your_rapidapi_key
PERENUAL_API_KEY=your_perenual_key
```

Run Flask server:
```sh
python app.py
```

Backend runs on `http://localhost:5000`

---

### 3. Database Setup (Supabase)

1. Create a Supabase project at https://supabase.com
2. Get your project URL and keys from Settings > API
3. The backend automatically creates tables on first run:
   - `profiles` - User data
   - `collections` - Plant collection containers
   - `collection_plants` - Individual plant records
   - `forum_posts` - Community posts
   - `forum_comments` - Threaded comments

4. Row Level Security (RLS) is enabled for data isolation

---

## API Documentation

### Authentication
- `POST /api/v1/auth/signup` - Create new user account
- `POST /api/v1/auth/login` - Sign in and get JWT token

### Plant Search
- `GET /api/v1/plants?name=<query>&type=<indoor|other>` - Search plants

### Collections (JWT Required)
- `GET /api/v1/collections` - Get all user collections
- `POST /api/v1/collections/create` - Create new collection
- `POST /api/v1/collections` - Add plant to collection
- `PUT /api/v1/collections/rename` - Rename collection
- `DELETE /api/v1/collections/<plant_id>` - Delete plant
- `DELETE /api/v1/collections/container/<name>` - Delete collection

### AI Planner (JWT Required)
- `POST /api/v1/ai/plan` - Generate AI garden plan

### Forum
- `GET /api/v1/forum/posts` - Get recent posts (public)
- `POST /api/v1/forum/posts` - Create post (JWT required)
- `GET /api/v1/forum/posts/<id>/comments` - Get comments (public)
- `POST /api/v1/forum/posts/<id>/comments` - Add comment (JWT required)

### Profile (JWT Required)
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile/email` - Update email
- `PUT /api/v1/profile/password` - Update password

---

## Database Schema

### Tables

**profiles**
- `id` (UUID, PK) - User ID from Supabase Auth
- `email` (TEXT) - User email
- `created_at` (TIMESTAMP)

**collections**
- `id` (SERIAL, PK)
- `user_id` (UUID, FK) - References profiles
- `collection_name` (TEXT)
- `status` (TEXT)
- `created_at` (TIMESTAMP)

**collection_plants**
- `id` (SERIAL, PK)
- `collection_id` (INTEGER, FK) - References collections (CASCADE delete)
- `common_name` (TEXT)
- `plant_details_json` (JSONB)
- `added_at` (TIMESTAMP)

**forum_posts**
- `id` (SERIAL, PK)
- `user_id` (UUID, FK) - References profiles
- `title` (TEXT)
- `content` (TEXT)
- `created_at` (TIMESTAMP)

**forum_comments**
- `id` (SERIAL, PK)
- `post_id` (INTEGER, FK) - References forum_posts
- `user_id` (UUID, FK) - References profiles
- `content` (TEXT)
- `parent_comment_id` (INTEGER, FK) - Self-reference for threading
- `created_at` (TIMESTAMP)

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anon/public key
NEXT_PUBLIC_API_URL=              # Backend API URL
```

### Backend (.env)
```env
SUPABASE_URL=                     # Supabase project URL
SUPABASE_KEY=                     # Supabase service role key
GEMINI_API_KEY=                   # Google Gemini API key
RAPIDAPI_KEY=                     # RapidAPI key (House Plants 2)
PERENUAL_API_KEY=                 # Perenual API key
```

---

## Development

### Running Tests

Frontend:
```sh
cd frontend
npm test
```

Backend:
```sh
cd backend
pytest
```

### Development Workflow
1. Start backend server: `cd backend && python app.py`
2. Start frontend dev server: `cd frontend && npm run dev`
3. Access app at `http://localhost:3000`

### Production Deployment
- **Frontend**: Deploy to Vercel, Netlify, or similar
- **Backend**: Deploy to Render, Heroku, or Railway
- **Database**: Hosted on Supabase (already managed)

---

## Security Features
- JWT authentication with ECC (SECP256R1) signatures
- Row Level Security (RLS) on all user data
- CORS configuration for frontend-backend communication
- Secure password hashing via Supabase Auth
- Environment variables for sensitive credentials

---

## Contributing
1. Create feature branch
2. Make changes with tests
3. Run linters and tests
4. Submit pull request

---

## License
MIT
