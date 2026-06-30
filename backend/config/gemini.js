const { GoogleGenAI } = require("@google/genai");

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_TEMPERATURE = 0.6;

let cachedClient = null;
let cachedApiKey = "";

function normalizeModel(model) {
  return (model || DEFAULT_GEMINI_MODEL).trim();
}

function isSupportedGeminiModelName(model) {
  return /^(models\/)?gemini-[a-z0-9.-]+$/i.test(model);
}

function getGeminiConfig() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = normalizeModel(process.env.GEMINI_MODEL);

  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY is not configured. Add it to backend/.env and restart the backend.",
    );
    err.statusCode = 500;
    err.code = "GEMINI_API_KEY_MISSING";
    throw err;
  }

  if (!isSupportedGeminiModelName(model)) {
    const err = new Error(
      `GEMINI_MODEL must be a Gemini model id such as ${DEFAULT_GEMINI_MODEL} or models/${DEFAULT_GEMINI_MODEL}.`,
    );
    err.statusCode = 500;
    err.code = "GEMINI_MODEL_INVALID";
    throw err;
  }

  return {
    apiKey,
    model,
    temperature: DEFAULT_TEMPERATURE,
  };
}

function getGeminiClient() {
  const config = getGeminiConfig();

  if (!cachedClient || cachedApiKey !== config.apiKey) {
    cachedClient = new GoogleGenAI({ apiKey: config.apiKey });
    cachedApiKey = config.apiKey;
  }

  return { client: cachedClient, config };
}

module.exports = {
  DEFAULT_GEMINI_MODEL,
  getGeminiClient,
  getGeminiConfig,
};
