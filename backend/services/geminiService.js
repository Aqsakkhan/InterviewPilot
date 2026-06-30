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
      "GEMINI_API_KEY is not set on the server. Add it to backend/.env (see .env.example) and restart the backend.",
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
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
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
async function generateNextQuestion({
  profile,
  resume,
  type,
  difficulty,
  history,
}) {
  return generateJSON(
    questionGenerationPrompt({ profile, resume, type, difficulty, history }),
    questionGenerationSchema,
  );
}

/**
 * Scores a finished interview transcript and produces feedback.
 */
async function evaluateInterview({ profile, type, difficulty, qaList }) {
  return generateJSON(
    evaluationPrompt({ profile, type, difficulty, qaList }),
    evaluationSchema,
  );
}

module.exports = { extractResumeData, generateNextQuestion, evaluateInterview };
const {
  resumeExtractionPrompt,
  resumeExtractionSchema,
  questionGenerationPrompt,
  questionGenerationSchema,
  evaluationPrompt,
  evaluationSchema,
} = require("../utils/prompts");
const { getGeminiClient } = require("../config/gemini");

function logGeminiInfo(message, meta = {}) {
  console.info("[gemini]", message, meta);
}

function logGeminiError(message, err, meta = {}) {
  console.error("[gemini]", message, {
    ...meta,
    code: err?.code,
    status: err?.status || err?.statusCode,
    message: err?.message,
  });
}

/**
 * Strips ```json fences if the model adds them despite JSON response config.
 */
function safeParseJson(text, operation) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    err.statusCode = 502;
    err.code = "GEMINI_JSON_PARSE_FAILED";
    err.message = `Gemini returned invalid JSON for ${operation}.`;
    err.responseSnippet = cleaned.slice(0, 500);
    throw err;
  }
}

function getResponseText(response) {
  if (typeof response?.text === "string") return response.text;
  if (typeof response?.text === "function") return response.text();
  return "";
}

function toGeminiError(err, operation, startedAt) {
  if (err.statusCode) return err;

  const wrapped = new Error(
    `Gemini request failed while running ${operation}.`,
  );

  wrapped.statusCode = err?.status || 502;
  wrapped.code = err?.code || "GEMINI_REQUEST_FAILED";
  wrapped.cause = err;
  wrapped.durationMs = Date.now() - startedAt;

  return wrapped;
}

async function generateJSON(operation, prompt, schema) {
  const startedAt = Date.now();
  const { client, config } = getGeminiClient();

  logGeminiInfo("request started", {
    operation,
    model: config.model,
    promptChars: prompt.length,
  });

  try {
    const response = await client.models.generateContent({
      model: config.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: config.temperature,
      },
    });

    const text = getResponseText(response);

    if (!text) {
      const err = new Error(
        `Gemini returned an empty response for ${operation}.`,
      );

      err.statusCode = 502;
      err.code = "GEMINI_EMPTY_RESPONSE";
      throw err;
    }

    const parsed = safeParseJson(text, operation);

    logGeminiInfo("request completed", {
      operation,
      model: config.model,
      durationMs: Date.now() - startedAt,
    });

    return parsed;
  } catch (err) {
    const wrapped = toGeminiError(err, operation, startedAt);

    logGeminiError("request failed", wrapped, {
      operation,
      model: config.model,
      durationMs: wrapped.durationMs || Date.now() - startedAt,
      responseSnippet: wrapped.responseSnippet,
    });

    throw wrapped;
  }
}

/**
 * Extracts structured resume data (skills, projects,
 * internships, etc.) from raw resume text.
 */
async function extractResumeData(rawText) {
  return generateJSON(
    "resume extraction",
    resumeExtractionPrompt(rawText),
    resumeExtractionSchema,
  );
}

/**
 * Generates one interview question.
 */
async function generateNextQuestion({
  profile,
  resume,
  type,
  difficulty,
  history,
}) {
  return generateJSON(
    "question generation",
    questionGenerationPrompt({
      profile,
      resume,
      type,
      difficulty,
      history,
    }),
    questionGenerationSchema,
  );
}

/**
 * Evaluates a completed interview.
 */
async function evaluateInterview({ profile, type, difficulty, qaList }) {
  return generateJSON(
    "interview evaluation",
    evaluationPrompt({
      profile,
      type,
      difficulty,
      qaList,
    }),
    evaluationSchema,
  );
}

module.exports = {
  extractResumeData,
  generateNextQuestion,
  evaluateInterview,
};
