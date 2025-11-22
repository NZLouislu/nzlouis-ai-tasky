import { taskyDb } from "@/lib/supabase/tasky-db-client";
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
    const { data, error } = await taskyDb
      .from("user_platform_configs")
      .select("*")
      .eq("user_id", userId)
      .eq("platform", "jira")
      .eq("config_name", configName)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.error("Failed to load Jira config:", error);
      return null;
    }

    const apiToken = decrypt(data.jira_api_token_encrypted);

    return {
      jiraUrl: data.jira_url,
      email: data.jira_email,
      apiToken,
      projectKey: data.jira_project_key,
      issueTypeId: "10001",
    };
  } catch (error) {
    console.error("Error loading Jira config:", error);
    return null;
  }
}
