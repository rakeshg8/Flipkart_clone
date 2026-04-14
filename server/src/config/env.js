import dotenv from "dotenv";

dotenv.config();

const required = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  cohereApiKey: process.env.COHERE_API_KEY || "",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
  openrouterFallbackModels: (process.env.OPENROUTER_FALLBACK_MODELS || "meta-llama/llama-3.3-70b-instruct:free,google/gemma-3-12b-it:free,openai/gpt-oss-20b:free")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean)
};
