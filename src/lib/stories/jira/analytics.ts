export interface StoryStatus {
  status: string;
  count: number;
  stories: string[];
}

export interface ProgressAnalysis {
  totalStories: number;
  completionPercentage: number;
  statusBreakdown: StoryStatus[];
  blockedStories: string[];
  stalledStories: string[];
  highPriorityBacklog: string[];
}

export function parseStoryStatuses(markdownContent: string): Map<string, string[]> {
  const statusMap = new Map<string, string[]>();
  const lines = markdownContent.split("\n");
  let currentStatus = "";

  for (const line of lines) {
    const statusMatch = line.match(/^##\s+(.+)$/);
    if (statusMatch) {
      currentStatus = statusMatch[1].trim();
      if (!statusMap.has(currentStatus)) {
        statusMap.set(currentStatus, []);
      }
      continue;
    }

    const storyMatch = line.match(/^-\s+Story:\s+(.+)$/);
    if (storyMatch && currentStatus) {
      const storyTitle = storyMatch[1].trim();
      statusMap.get(currentStatus)?.push(storyTitle);
    }
  }

  return statusMap;
}

export function calculateCompletionPercentage(statusMap: Map<string, string[]>): number {
  let total = 0;
  let completed = 0;

  for (const [status, stories] of statusMap.entries()) {
    total += stories.length;
    if (status.toLowerCase().includes("done") || status.toLowerCase().includes("complete")) {
      completed += stories.length;
    }
  }

  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function analyzeProgress(markdownContent: string): ProgressAnalysis {
  const statusMap = parseStoryStatuses(markdownContent);
  const statusBreakdown: StoryStatus[] = [];
  let totalStories = 0;

  for (const [status, stories] of statusMap.entries()) {
    totalStories += stories.length;
    statusBreakdown.push({
      status,
      count: stories.length,
      stories,
    });
  }

  const completionPercentage = calculateCompletionPercentage(statusMap);

  const blockedStories = extractStoriesWithKeyword(markdownContent, "blocked");
  const stalledStories = identifyStalledStories(markdownContent);
  const highPriorityBacklog = extractHighPriorityBacklog(markdownContent);

  return {
    totalStories,
    completionPercentage,
    statusBreakdown,
    blockedStories,
    stalledStories,
    highPriorityBacklog,
  };
}

function extractStoriesWithKeyword(content: string, keyword: string): string[] {
  const stories: string[] = [];
  const lines = content.split("\n");
  let currentStory = "";

  for (const line of lines) {
    const storyMatch = line.match(/^-\s+Story:\s+(.+)$/);
    if (storyMatch) {
      currentStory = storyMatch[1].trim();
    }

    if (currentStory && line.toLowerCase().includes(keyword.toLowerCase())) {
      if (!stories.includes(currentStory)) {
        stories.push(currentStory);
      }
    }
  }

  return stories;
}

function identifyStalledStories(content: string): string[] {
  const inProgressStories: string[] = [];
  const lines = content.split("\n");
  let inInProgressSection = false;
  let currentStory = "";

  for (const line of lines) {
    const statusMatch = line.match(/^##\s+(.+)$/);
    if (statusMatch) {
      const status = statusMatch[1].trim().toLowerCase();
      inInProgressSection = status.includes("in progress") || status.includes("doing");
      continue;
    }

    if (inInProgressSection) {
      const storyMatch = line.match(/^-\s+Story:\s+(.+)$/);
      if (storyMatch) {
        currentStory = storyMatch[1].trim();
        inProgressStories.push(currentStory);
      }
    }
  }

  return inProgressStories;
}

function extractHighPriorityBacklog(content: string): string[] {
  const highPriorityStories: string[] = [];
  const lines = content.split("\n");
  let inBacklogSection = false;
  let currentStory = "";
  let isHighPriority = false;

  for (const line of lines) {
    const statusMatch = line.match(/^##\s+(.+)$/);
    if (statusMatch) {
      const status = statusMatch[1].trim().toLowerCase();
      inBacklogSection = status.includes("backlog");
      continue;
    }

    if (inBacklogSection) {
      const storyMatch = line.match(/^-\s+Story:\s+(.+)$/);
      if (storyMatch) {
        currentStory = storyMatch[1].trim();
        isHighPriority = false;
      }

      const priorityMatch = line.match(/Priority:\s*(High|Critical|P0|P1)/i);
      if (priorityMatch && currentStory) {
        isHighPriority = true;
      }

      if (isHighPriority && currentStory && !highPriorityStories.includes(currentStory)) {
        highPriorityStories.push(currentStory);
        isHighPriority = false;
      }
    }
  }

  return highPriorityStories;
}

export function generateProgressReport(analysis: ProgressAnalysis): string {
  const report: string[] = [];

  report.push("# Project Progress Report");
  report.push("");
  report.push(`## Overview`);
  report.push(`- Total Stories: ${analysis.totalStories}`);
  report.push(`- Completion: ${analysis.completionPercentage}%`);
  report.push("");

  report.push("## Status Breakdown");
  for (const status of analysis.statusBreakdown) {
    const percentage = analysis.totalStories > 0 
      ? Math.round((status.count / analysis.totalStories) * 100) 
      : 0;
    report.push(`- ${status.status}: ${status.count} (${percentage}%)`);
  }
  report.push("");

  if (analysis.highPriorityBacklog.length > 0) {
    report.push("## High Priority Items in Backlog");
    for (const story of analysis.highPriorityBacklog) {
      report.push(`- ${story}`);
    }
    report.push("");
  }

  if (analysis.stalledStories.length > 0) {
    report.push("## In Progress (Potential Stalls)");
    for (const story of analysis.stalledStories) {
      report.push(`- ${story}`);
    }
    report.push("");
  }

  if (analysis.blockedStories.length > 0) {
    report.push("## Blocked Stories");
    for (const story of analysis.blockedStories) {
      report.push(`- ${story}`);
    }
    report.push("");
  }

  return report.join("\n");
}
