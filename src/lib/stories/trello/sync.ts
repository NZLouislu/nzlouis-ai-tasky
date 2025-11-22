import { mdToTrello, trelloToMd } from "trello-md-sync";
import type { MdToTrelloConfig, TrelloToMdArgs } from "trello-md-sync";
import { loadTrelloConfig, type TrelloSyncOptions } from "./config";

export async function syncToTrello(options: TrelloSyncOptions) {
  const { userId, inputDir, configName = "Default", dryRun = false } = options;

  if (!inputDir) {
    throw new Error("inputDir is required");
  }

  const config = await loadTrelloConfig(userId, configName);

  if (!config) {
    throw new Error(
      "Trello configuration not found. Please connect to Trello first."
    );
  }

  const syncConfig: MdToTrelloConfig = {
    trelloKey: config.trelloKey,
    trelloToken: config.trelloToken,
    trelloBoardId: config.trelloBoardId,
    mdInputDir: inputDir,
    mdOutputDir: "./trello_export",
    logLevel: "info",
    dryRun,
    ensureLabels: true,
  };

  const result = await mdToTrello(syncConfig);

  return {
    created: result.result.created,
    updated: result.result.updated,
  };
}

export async function syncFromTrello(options: TrelloSyncOptions) {
  const { userId, outputDir, configName = "Default" } = options;

  if (!outputDir) {
    throw new Error("outputDir is required");
  }

  const config = await loadTrelloConfig(userId, configName);

  if (!config) {
    throw new Error(
      "Trello configuration not found. Please connect to Trello first."
    );
  }

  const syncConfig: TrelloToMdArgs = {
    trelloKey: config.trelloKey,
    trelloToken: config.trelloToken,
    trelloBoardId: config.trelloBoardId,
    mdOutputDir: outputDir,
  };

  const result = await trelloToMd(syncConfig);

  return {
    written: result.written,
  };
}
