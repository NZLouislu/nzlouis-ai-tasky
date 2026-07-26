import { db } from "@/lib/db/connection";
import { userPlatformConfigs } from "@/lib/db/schema/stories";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

export interface TrelloConfig {
  trelloKey: string;
  trelloToken: string;
  trelloBoardId: string;
}

export interface TrelloSyncOptions {
  userId: string;
  inputDir?: string;
  outputDir?: string;
  configName?: string;
  dryRun?: boolean;
}

export async function loadTrelloConfig(
  userId: string,
  configName: string = "Default"
): Promise<TrelloConfig | null> {
  try {
    const [data] = await db
      .select()
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, "trello"),
          eq(userPlatformConfigs.configName, configName),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    if (!data) {
      console.error("Failed to load Trello config: no config found");
      return null;
    }

    const trelloKey = decrypt(data.trelloKeyEncrypted!);
    const trelloToken = decrypt(data.trelloTokenEncrypted!);

    return {
      trelloKey,
      trelloToken,
      trelloBoardId: data.trelloBoardId!,
    };
  } catch (error) {
    console.error("Error loading Trello config:", error);
    return null;
  }
}
