import { taskyDb } from "@/lib/supabase/tasky-db-client";
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
    const { data, error } = await taskyDb
      .from("user_platform_configs")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "trello")
      .eq("config_name", configName)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.error("Failed to load Trello config:", error);
      return null;
    }

    const trelloKey = decrypt(data.trello_key_encrypted);
    const trelloToken = decrypt(data.trello_token_encrypted);

    return {
      trelloKey,
      trelloToken,
      trelloBoardId: data.trello_board_id,
    };
  } catch (error) {
    console.error("Error loading Trello config:", error);
    return null;
  }
}
