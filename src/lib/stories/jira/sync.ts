import { mdToJira as mdToJiraSync, jiraToMd as jiraToMdSync } from "jira-md-sync";
import { loadJiraConfig, type JiraSyncOptions } from "./config";

export async function syncToJira(options: JiraSyncOptions) {
  const { userId, inputDir, configName = "Default", dryRun = false } = options;

  if (!inputDir) {
    throw new Error("inputDir is required");
  }

  const jiraConfig = await loadJiraConfig(userId, configName);

  if (!jiraConfig) {
    throw new Error("Jira configuration not found. Please connect to Jira first.");
  }

  const result = await mdToJiraSync({
    jiraConfig: {
      jiraUrl: jiraConfig.jiraUrl,
      email: jiraConfig.email,
      apiToken: jiraConfig.apiToken,
      projectKey: jiraConfig.projectKey,
      issueTypeId: jiraConfig.issueTypeId,
    },
    inputDir,
    dryRun,
    logger: console,
  });

  return {
    created: result.created,
    skipped: result.skipped,
    errors: result.errors,
  };
}

export async function syncFromJira(options: JiraSyncOptions) {
  const { userId, outputDir, configName = "Default", jql } = options;

  if (!outputDir) {
    throw new Error("outputDir is required");
  }

  const jiraConfig = await loadJiraConfig(userId, configName);

  if (!jiraConfig) {
    throw new Error("Jira configuration not found. Please connect to Jira first.");
  }

  const result = await jiraToMdSync({
    jiraConfig: {
      jiraUrl: jiraConfig.jiraUrl,
      email: jiraConfig.email,
      apiToken: jiraConfig.apiToken,
      projectKey: jiraConfig.projectKey,
    },
    outputDir,
    inputDir: outputDir,
    jql,
    logger: console,
  });

  return {
    written: result.written,
    totalIssues: result.totalIssues,
  };
}
