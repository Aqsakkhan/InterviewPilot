# InterviewPilot AI

AI-powered placement interview simulator. Upload your resume, pick a round
(HR, Technical, DSA, Project Viva, or a Full Placement panel), and talk
through a live, voice-driven mock interview that asks follow-ups based on
what you actually say - then get a scored report.

This is a real full-stack app wired to **real services**:

- **MongoDB Atlas** - stores users, resumes, interviews
- **Firebase Authentication** - Google sign-in
- **Gemini API** - generates questions, follow-ups, and grades your answers
- **Web Speech API** - voice input/output, runs entirely in the browser, no key needed

```
InterviewPilotAI/
  backend/   Express API (Node.js, MongoDB, Firebase Admin, Gemini)
  frontend/  React app (Vite, Tailwind v4, Firebase client SDK)
```

You'll need accounts for MongoDB Atlas, Firebase, and Google AI Studio - all
have free tiers that are enough to run and demo this project.

---

## 1. MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. **Database Access** -> add a database user (username + password)
3. **Network Access** -> add `0.0.0.0/0` (or your IP) so the backend can connect
4. **Connect** -> "Drivers" -> copy the connection string, it looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/`
5. You'll paste this into `backend/.env` as `MONGO_URI` below.

---

## 2. Firebase (Google sign-in)

1. Create a project at https://console.firebase.google.com
2. **Build -> Authentication -> Get started -> Sign-in method -> Google** -> enable it
3. **Project settings -> General -> Your apps -> Add app -> Web (</>)** - register
   an app and copy the `firebaseConfig` values. These go into `frontend/.env`.
4. **Project settings -> Service accounts -> Generate new private key** - this
   downloads a JSON file. You'll copy three fields from it into `backend/.env`:
   `project_id`, `client_email`, and `private_key`.
5. Back in **Authentication -> Settings -> Authorized domains**, make sure
   `localhost` is listed (it is by default).

---

## 3. Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Create an API key (free tier is fine to start)
3. This goes into `backend/.env` as `GEMINI_API_KEY`

---

## 4. Configure environment variables

**Backend** - copy the template and fill it in:

```bash
cd backend
cp .env.example .env
```

Fill in `MONGO_URI`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
`FIREBASE_PRIVATE_KEY` (keep the quotes and `\n` characters exactly as they
appear in the downloaded JSON), and `GEMINI_API_KEY`.

**Frontend** - copy the template and fill it in:

```bash
cd frontend
cp .env.example .env
```

Fill in the six `VITE_FIREBASE_*` values from your Firebase web app config.

---

## 5. Install and run

Two terminals:

```bash
# Terminal 1 - backend
cd backend
npm install
npm run dev          # http://localhost:5000

# Terminal 2 - frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Open http://localhost:5173, sign in with Google, fill in your profile,
upload a PDF resume, and start an interview. Use Chrome for the best Web
Speech API support (voice input works in Chrome/Edge; Safari/Firefox fall
back gracefully to typed answers).

---

## How the AI loop works

1. **Resume upload** - the backend extracts raw text from your PDF
   (`pdf-parse`), then asks Gemini to pull out structured skills, projects,
   internships, and "strong vs weak" areas.
2. **Interview start** - Gemini generates the first question, grounded in
   your resume, the round type, and difficulty.
3. **Each answer** - your answer is saved, and Gemini is asked for the next
   question - it either drills into your last answer with a follow-up, or
   moves on, the way a real interviewer would.
4. **Wrap-up** - once the target number of questions is reached (roughly one
   per 2.5 minutes of your chosen duration), Gemini grades the full
   transcript and returns scores, strengths, and improvements.

All of this lives in `backend/services/geminiService.js` and
`backend/utils/prompts.js` if you want to tune the prompts, scoring rubric,
or question pacing.

---

## Notes & things you may want to change

- **Model**: defaults to `gemini-2.5-flash` (set via `GEMINI_MODEL` in
  `backend/.env`). Swap to a different Gemini model name if you want higher
  quality questions at a higher cost.
- **Costs**: each question and the final grading call uses a small Gemini
  request. Free-tier limits are generally enough for demoing and personal
  practice.
- **One resume per user**: re-uploading replaces the previous one. Extend
  `models/Resume.js` if you want to keep multiple versions.
- **Security**: the Gemini API key only ever lives on the backend - never
  call Gemini directly from the frontend in production.
