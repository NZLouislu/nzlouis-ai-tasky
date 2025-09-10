/**
 * Environment configuration utility
 * Manages and validates environment variables for the project
 */

// Define environment variable types
export interface EnvironmentConfig {
  // Admin authentication
  adminUsername?: string;
  adminPassword?: string;

  // Task database (Supabase)
  taskySupabaseUrl?: string;
  taskySupabaseAnonKey?: string;

  // Blog database (Supabase)
  blogSupabaseUrl?: string;
  blogSupabaseServiceRoleKey?: string;

  // Google API
  googleApiKey?: string;
  nextPublicGaId?: string;

  // Gemini AI API
  geminiApiUrl?: string;
  auLouisGeminiApi?: string;

  // OpenRouter/GPT API
  gptOssKey?: string;

  // Kilo Code
  kiloCodeKey?: string;

  // HuggingFace
  hfSpaceUrl?: string;

  // System environment
  nodeEnv?: string;
}

/**
 * Read environment variables from process.env
 * @returns EnvironmentConfig environment configuration object
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    // Admin authentication config
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,

    // Task database config
    taskySupabaseUrl: process.env.TASKY_SUPABASE_URL,
    taskySupabaseAnonKey: process.env.TASKY_SUPABASE_ANON_KEY,

    // Blog database config
    blogSupabaseUrl: process.env.BLOG_SUPABASE_URL,
    blogSupabaseServiceRoleKey: process.env.BLOG_SUPABASE_SERVICE_ROLE_KEY,

    // API config
    googleApiKey: process.env.GOOGLE_API_KEY,
    nextPublicGaId: process.env.NEXT_PUBLIC_GA_ID,
    geminiApiUrl: process.env.GEMINI_API_URL,
    auLouisGeminiApi: process.env.AULouis_Gemini_API,
    gptOssKey: process.env.GPT_OSS_KEY,
    kiloCodeKey: process.env.Kilo_code_key,
    hfSpaceUrl: process.env.HF_SPACE_URL,

    // System config
    nodeEnv: process.env.NODE_ENV,
  };
}

/**
 * Validate required environment variables
 * @param requiredVars list of required environment variables
 * @returns boolean validation result
 */
export function validateEnvironmentVariables(
  requiredVars: (keyof EnvironmentConfig)[]
): boolean {
  const config = getEnvironmentConfig();
  const missingVars: string[] = [];

  for (const varName of requiredVars) {
    if (!config[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
    console.error("Please set these variables in .env file");
    return false;
  }

  return true;
}

/**
 * Get admin authentication config
 * @returns admin username and password
 */
export function getAdminConfig() {
  const config = getEnvironmentConfig();
  return {
    username: config.adminUsername,
    password: config.adminPassword,
  };
}

/**
 * Get task database config
 * @returns task database URL and anon key
 */
export function getTaskySupabaseConfig() {
  const config = getEnvironmentConfig();
  return {
    url: config.taskySupabaseUrl,
    anonKey: config.taskySupabaseAnonKey,
  };
}

/**
 * Get blog database config
 * @returns blog database URL and service role key
 */
export function getBlogSupabaseConfig() {
  const config = getEnvironmentConfig();
  return {
    url: config.blogSupabaseUrl,
    serviceRoleKey: config.blogSupabaseServiceRoleKey,
  };
}

/**
 * Get Google API config
 * @returns Google API key and analytics ID
 */
export function getGoogleConfig() {
  const config = getEnvironmentConfig();
  return {
    apiKey: config.googleApiKey,
    analyticsId: config.nextPublicGaId,
  };
}

/**
 * Get Gemini AI config
 * @returns Gemini API URL and key
 */
export function getGeminiConfig() {
  const config = getEnvironmentConfig();
  return {
    apiUrl: config.geminiApiUrl,
    apiKey: config.auLouisGeminiApi,
  };
}

/**
 * Get GPT/OpenRouter config
 * @returns GPT OSS key
 */
export function getGptConfig() {
  const config = getEnvironmentConfig();
  return {
    ossKey: config.gptOssKey,
  };
}

/**
 * Check if running in production environment
 * @returns boolean whether in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development environment
 * @returns boolean whether in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Print environment variables status (development mode only)
 */
export function debugEnvironmentVariables(): void {
  if (isDevelopment()) {
    const config = getEnvironmentConfig();
    console.log("Environment variables status:");
    console.log("├── Admin config:", config.adminUsername ? "✅" : "❌");
    console.log("├── Task database:", config.taskySupabaseUrl ? "✅" : "❌");
    console.log("├── Blog database:", config.blogSupabaseUrl ? "✅" : "❌");
    console.log("├── Google API:", config.googleApiKey ? "✅" : "❌");
    console.log("├── Gemini API:", config.geminiApiUrl ? "✅" : "❌");
    console.log("└── GPT API:", config.gptOssKey ? "✅" : "❌");
  }
}

// Default export environment config
export default getEnvironmentConfig();
