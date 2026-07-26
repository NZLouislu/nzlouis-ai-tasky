import { db } from "@/lib/db/connection";
import { userPlatformConfigs } from "@/lib/db/schema/stories";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";

export interface JiraConfig {
  jiraUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueTypeId?: string;
}

export interface JiraSyncOptions {
  userId: string;
  inputDir?: string;
  outputDir?: string;
  configName?: string;
  dryRun?: boolean;
  jql?: string;
}

export async function loadJiraConfig(
  userId: string,
  configName: string = "Default"
): Promise<JiraConfig | null> {
  try {
    const [data] = await db
      .select()
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, "jira"),
          eq(userPlatformConfigs.configName, configName),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    if (!data) {
      console.error("Failed to load Jira config: no config found");
      return null;
    }

    const apiToken = decrypt(data.jiraApiTokenEncrypted!);

    return {
      jiraUrl: data.jiraUrl!,
      email: data.jiraEmail!,
      apiToken,
      projectKey: data.jiraProjectKey!,
      issueTypeId: "10001",
    };
  } catch (error) {
    console.error("Error loading Jira config:", error);
    return null;
  }
}
