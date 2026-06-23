const { GoogleGenAI } = require("@google/genai");
const {
  resumeExtractionPrompt,
  resumeExtractionSchema,
  questionGenerationPrompt,
  questionGenerationSchema,
  evaluationPrompt,
  evaluationSchema,
} = require("../utils/prompts");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let aiClient = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    const err = new Error(
      "GEMINI_API_KEY is not set on the server. Add it to backend/.env (see .env.example) and restart the backend."
    );
    err.statusCode = 500;
    throw err;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

/** Strips ```json fences if the model adds them despite responseSchema. */
function safeParseJson(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  return JSON.parse(cleaned);
}

async function generateJSON(prompt, schema) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0.6,
    },
  });

  if (!response.text) {
    const err = new Error("Gemini returned an empty response.");
    err.statusCode = 502;
    throw err;
  }

  return safeParseJson(response.text);
}

/**
 * Extracts structured resume data (skills, projects, internships, etc.)
 * from raw resume text pulled out of the uploaded PDF.
 */
async function extractResumeData(rawText) {
  return generateJSON(resumeExtractionPrompt(rawText), resumeExtractionSchema);
}

/**
 * Generates exactly one interview question, aware of resume context,
 * round type/difficulty, and everything asked/answered so far.
 */
async function generateNextQuestion({ profile, resume, type, difficulty, history }) {
  return generateJSON(
    questionGenerationPrompt({ profile, resume, type, difficulty, history }),
    questionGenerationSchema
  );
}

/**
 * Scores a finished interview transcript and produces feedback.
 */
async function evaluateInterview({ profile, type, difficulty, qaList }) {
  return generateJSON(
    evaluationPrompt({ profile, type, difficulty, qaList }),
    evaluationSchema
  );
}

module.exports = { extractResumeData, generateNextQuestion, evaluateInterview };
