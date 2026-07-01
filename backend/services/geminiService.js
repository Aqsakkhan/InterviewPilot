const prompts = require("../utils/prompts");
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
    prompts.resumeExtractionPrompt(rawText),
    prompts.resumeExtractionSchema,
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
  company,
  jobRole,
  experienceLevel,
  plan,
  history,
}) {
  return generateJSON(
    "question generation",
    prompts.questionGenerationPrompt({
      profile,
      resume,
      type,
      difficulty,
      company,
      jobRole,
      experienceLevel,
      plan,
      history,
    }),
    prompts.questionGenerationSchema,
  );
}

/**
 * Evaluates a completed interview.
 */
async function evaluateInterview({ profile, type, difficulty, qaList }) {
  return generateJSON(
    "interview evaluation",
    prompts.evaluationPrompt({
      profile,
      type,
      difficulty,
      qaList,
    }),
    prompts.evaluationSchema,
  );
}

module.exports = {
  extractResumeData,
  generateNextQuestion,
  evaluateInterview,
};
