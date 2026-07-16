# InterviewPilot AI

AI-powered placement interview simulator. Upload your resume, pick a company and a round type (HR, Technical, DSA, Project Viva, or a Full Placement panel), and talk through a live, voice-driven mock interview that reacts to what you actually say — then get a scored performance report with a personalized study plan.

**Live demo:** https://interview-pilot-lake.vercel.app

This is a real full-stack app wired to real services:

- **MongoDB Atlas** — stores users, resumes, interviews
- **Firebase Authentication** — Google and email/password sign-in
- **Gemini API** — generates questions, decides follow-ups, and grades your answers
- **Web Speech API** — voice input/output, runs entirely in the browser, no extra key or cost

```
InterviewPilot/
  backend/   Express API (Node.js, MongoDB, Firebase Admin, Gemini)
  frontend/  React app (Vite, Tailwind, Firebase client SDK)
```

---

## Features

**Resume Intelligence** — upload a PDF, get structured extraction of skills/projects/experience, a deterministic ATS score and Resume Strength score, role-specific missing-skill suggestions, ATS score history over time, and a downloadable PDF report.

**Interview Engine** — five round types (HR, Technical, DSA, Project Viva, Full Placement), company-specific interview styles (Google, Amazon, Microsoft, TCS, Infosys, and more), questions generated from your actual resume projects, full voice interaction (speaks the question, listens to your answer), and smart follow-up questions that dig deeper into vague or interesting answers instead of just moving down a fixed list.

**Performance Reports** — scored across 8 axes (technical knowledge, communication, confidence, problem-solving, HR, vocabulary, fluency, answer quality), company/role readiness verdicts, recruiter-style written feedback, a structured learning plan (topics to learn, resources, fresh practice questions, recommended next difficulty), and a downloadable PDF.

**Dashboard & Progress** — at-a-glance stats (resume health, average score, recent interview, recommended next interview) plus a dedicated Progress page with trend charts for score, per-skill performance, ATS history, and company/role readiness.

**Account & Settings** — Google/email login, editable profile, voice preferences (auto-read, rate, pitch), interview defaults (difficulty/duration/company), reduced-motion toggle, and full account deletion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), Tailwind CSS, React Router, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB via Mongoose, hosted on MongoDB Atlas |
| Auth | Firebase Authentication (client SDK + Admin SDK) |
| AI | Google Gemini API, structured JSON output |
| Voice | Web Speech API (browser-native) |
| PDF generation | PDFKit |
| Rate limiting | express-rate-limit |
| Hosting | Vercel (frontend), Render (backend) |

---

## Project Structure

```
backend/
  config/           DB connection, Firebase Admin init, Gemini client init
  controllers/      Request handling — user, resume, interview, interview stats
  middleware/        Auth guards, rate limiting, centralized error handling
  models/            Mongoose schemas — User, Resume, Interview
  routes/            Express routers
  services/          Gemini calls, resume scoring, PDF generation
  utils/             Prompt templates, interview plan builder, company/role blueprints
  server.js

frontend/
  src/
    api/            Axios instance with auth-token interceptor
    components/     Reusable UI — GlassCard, ScoreRing, Skeleton, ErrorState, etc.
    context/        AuthContext — global Firebase + profile state
    hooks/          useSpeechRecognition, useSpeechSynthesis
    pages/          One component per route
```

---

## Setup

You'll need free-tier accounts for **MongoDB Atlas**, **Firebase**, and **Google AI Studio**.

### 1. MongoDB Atlas
1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Database Access** → add a database user
3. **Network Access** → add `0.0.0.0/0` (or your IP)
4. **Connect → Drivers** → copy the connection string (`mongodb+srv://<user>:<password>@...`)

### 2. Firebase
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. **Authentication → Sign-in method** → enable Google (and/or Email/Password)
3. **Project settings → Your apps → Add app (Web)** → copy the `firebaseConfig` values for the frontend
4. **Project settings → Service accounts → Generate new private key** → downloads a JSON file; you'll need `project_id`, `client_email`, and `private_key` from it for the backend

### 3. Gemini API key
Get one free at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 4. Backend
```bash
cd backend
npm install
cp .env.example .env
```
Fill in `.env`:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_client_email
FIREBASE_PRIVATE_KEY="your_private_key_with_literal_\n_sequences"

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```
> Local dev alternative: drop the downloaded Firebase service account JSON at `backend/config/serviceAccountKey.json` (already gitignored) instead of setting the three `FIREBASE_*` vars — the app checks for that file first.

```bash
npm run dev   # http://localhost:5000
```

### 5. Frontend
```bash
cd frontend
npm install
cp .env.example .env
```
Fill in the six `VITE_FIREBASE_*` values plus:
```env
VITE_API_URL=http://localhost:5000/api
```
```bash
npm run dev   # http://localhost:5173
```

Open `http://localhost:5173`, sign in, complete your profile, upload a resume, and start an interview. Use Chrome or Edge for the best voice support — other browsers fall back to typed answers automatically.

---

## How the AI Loop Works

1. **Resume upload** — text is extracted from the PDF, then Gemini pulls out structured skills, projects, experience, and strong/weak areas (falls back to a local rule-based parser if Gemini fails)
2. **Interview start** — a topic "plan" is built from the resume, company, and role, and Gemini generates the first question grounded in it
3. **Each answer** — saved immediately, then Gemini decides whether to ask a follow-up (based on vagueness or an interesting detail worth probing) or move to the next planned topic, capped at 2 consecutive follow-ups
4. **Wrap-up** — once the target question count is reached (~1 per 2.5 minutes of chosen duration), one Gemini call grades the full transcript: scores, readiness, feedback, and a learning plan

Prompt logic lives in `backend/utils/prompts.js`; the plan/pacing logic is in `backend/utils/questionPlanner.js`; all Gemini calls are centralized in `backend/services/geminiService.js` (includes automatic retry on rate-limit errors).

---

## API Overview

All routes are under `/api` and require a Firebase ID token (Bearer header) unless noted.

| Method | Route | Description |
|---|---|---|
| POST | `/users/sync` | Sync Firebase user into MongoDB |
| POST | `/users/profile` | Complete onboarding |
| GET / PUT | `/users/me` | Get / update profile |
| PUT | `/users/preferences` | Update voice/interview/motion preferences |
| DELETE | `/users/me` | Delete account (cascades across all data) |
| POST | `/resume/upload` | Upload and analyze a resume |
| GET | `/resume/me` | Get current resume + analysis |
| POST | `/resume/analyze` | Re-run analysis on existing resume |
| GET | `/resume/analysis/pdf` | Download resume report PDF |
| POST | `/interviews` | Start a new interview |
| POST | `/interviews/:id/answer` | Submit an answer, get the next question |
| POST | `/interviews/:id/complete` | End an interview early |
| GET | `/interviews` | List all interviews |
| GET | `/interviews/:id` | Get one interview |
| GET | `/interviews/:id/report/pdf` | Download interview report PDF |
| GET | `/interviews/stats/summary` | Dashboard stats |
| GET | `/interviews/stats/progress` | Progress page trend data |

Interview creation/answering and resume upload/analysis are rate-limited per user to protect against AI-cost abuse.

---

## Notes & Things You Might Want to Change

- **Model**: defaults to `gemini-2.5-flash` (`GEMINI_MODEL` in `.env`) — swap for a different Gemini model if you want a quality/cost tradeoff
- **One resume per user**: re-uploading replaces the previous one; ATS score history is still tracked separately across re-uploads
- **Free-tier limits**: Gemini's free tier rate limit is the most likely bottleneck under concurrent usage (one automatic retry is built in); Render's free backend sleeps after 15 minutes idle
- **Security**: the Gemini API key only ever lives on the backend — never call it directly from the frontend
- **No automated tests yet** — testing is currently manual; a known gap if you extend this project

---

## Roadmap

- Automated tests for the core interview flow
- Pagination on interview history
- Streaming "thinking" indicator during question generation
- Shareable report links

---

Built with React, Express, MongoDB, Firebase, and Google Gemini.
