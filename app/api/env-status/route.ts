import { NextResponse } from "next/server";
import {
  getEnvironmentConfig,
  debugEnvironmentVariables,
} from "@/lib/environment";

export async function GET() {
  // 在开发模式下打印调试信息
  debugEnvironmentVariables();

  const config = getEnvironmentConfig();

  // 返回环境变量状态（不包含敏感信息）
  return NextResponse.json({
    status: "Environment variables loaded",
    configs: {
      admin: {
        username: config.adminUsername ? "loaded" : "missing",
        password: config.adminPassword ? "loaded" : "missing",
      },
      databases: {
        tasky: {
          url: config.taskySupabaseUrl ? "loaded" : "missing",
          key: config.taskySupabaseAnonKey ? "loaded" : "missing",
        },
        blog: {
          url: config.blogSupabaseUrl ? "loaded" : "missing",
          key: config.blogSupabaseServiceRoleKey ? "loaded" : "missing",
        },
      },
      apis: {
        google: config.googleApiKey ? "loaded" : "missing",
        gemini: config.geminiApiUrl ? "loaded" : "missing",
        gpt: config.gptOssKey ? "loaded" : "missing",
        kilo: config.kiloCodeKey ? "loaded" : "missing",
        hf: config.hfSpaceUrl ? "loaded" : "missing",
      },
      analytics: {
        ga: config.nextPublicGaId ? "loaded" : "missing",
      },
    },
  });
}
