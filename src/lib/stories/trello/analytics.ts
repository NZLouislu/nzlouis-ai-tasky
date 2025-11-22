interface Story {
  id: string;
  title: string;
  status: string;
  priority: string;
  labels: string[];
  acceptanceCriteria: string[];
}

interface ProgressReport {
  totalStories: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  completionPercentage: number;
  blockedStories: Story[];
  highPriorityBacklog: Story[];
  recommendations: string[];
}

export function parseStoryStatus(markdown: string): Story[] {
  const stories: Story[] = [];
  const sections = markdown.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.split("\n");
    const status = lines[0].trim();

    if (!["Backlog", "Ready", "In Progress", "Done"].includes(status)) {
      continue;
    }

    let currentStory: Partial<Story> | null = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      const storyMatch = line.match(/^- Story: (STORY-\d{3,}) (.+)$/);
      if (storyMatch) {
        if (currentStory) {
          stories.push(currentStory as Story);
        }
        currentStory = {
          id: storyMatch[1],
          title: storyMatch[2],
          status,
          priority: "Medium",
          labels: [],
          acceptanceCriteria: [],
        };
        continue;
      }

      if (currentStory) {
        const priorityMatch = line.match(/^\s+Priority: (.+)$/);
        if (priorityMatch) {
          currentStory.priority = priorityMatch[1].trim();
        }

        const labelsMatch = line.match(/^\s+Labels: \[(.+)\]$/);
        if (labelsMatch) {
          currentStory.labels = labelsMatch[1].split(",").map((l) => l.trim());
        }

        const criteriaMatch = line.match(/^\s+- \[ \] (.+)$/);
        if (criteriaMatch) {
          currentStory.acceptanceCriteria = currentStory.acceptanceCriteria || [];
          currentStory.acceptanceCriteria.push(criteriaMatch[1]);
        }
      }
    }

    if (currentStory) {
      stories.push(currentStory as Story);
    }
  }

  return stories;
}

export function calculateCompletionPercentage(stories: Story[]): number {
  if (stories.length === 0) return 0;
  const doneCount = stories.filter((s) => s.status === "Done").length;
  return Math.round((doneCount / stories.length) * 100);
}

export function identifyBlockedStories(stories: Story[]): Story[] {
  return stories.filter(
    (s) => s.status === "In Progress" && s.labels.includes("blocked")
  );
}

export function getHighPriorityBacklog(stories: Story[]): Story[] {
  return stories.filter(
    (s) => s.status === "Backlog" && s.priority === "High"
  );
}

export function generateProgressReport(markdown: string): ProgressReport {
  const stories = parseStoryStatus(markdown);

  const byStatus: Record<string, number> = {
    Backlog: 0,
    Ready: 0,
    "In Progress": 0,
    Done: 0,
  };

  const byPriority: Record<string, number> = {
    High: 0,
    Medium: 0,
    Low: 0,
  };

  for (const story of stories) {
    byStatus[story.status] = (byStatus[story.status] || 0) + 1;
    byPriority[story.priority] = (byPriority[story.priority] || 0) + 1;
  }

  const completionPercentage = calculateCompletionPercentage(stories);
  const blockedStories = identifyBlockedStories(stories);
  const highPriorityBacklog = getHighPriorityBacklog(stories);

  const recommendations: string[] = [];

  if (blockedStories.length > 0) {
    recommendations.push(
      `${blockedStories.length} story(ies) are blocked in "In Progress". Review and unblock them.`
    );
  }

  if (highPriorityBacklog.length > 0) {
    recommendations.push(
      `${highPriorityBacklog.length} high-priority story(ies) in Backlog. Consider moving to Ready.`
    );
  }

  if (byStatus["In Progress"] > 5) {
    recommendations.push(
      "Too many stories in progress. Focus on completing existing work."
    );
  }

  if (completionPercentage < 30 && byStatus.Backlog > 10) {
    recommendations.push(
      "Large backlog with low completion. Prioritize and break down stories."
    );
  }

  return {
    totalStories: stories.length,
    byStatus,
    byPriority,
    completionPercentage,
    blockedStories,
    highPriorityBacklog,
    recommendations,
  };
}

export function generateDailyReport(markdown: string): string {
  const report = generateProgressReport(markdown);

  return `
# Daily Progress Report

## Summary
- Total Stories: ${report.totalStories}
- Completion: ${report.completionPercentage}%

## Status Breakdown
- Backlog: ${report.byStatus.Backlog}
- Ready: ${report.byStatus.Ready}
- In Progress: ${report.byStatus["In Progress"]}
- Done: ${report.byStatus.Done}

## Priority Breakdown
- High: ${report.byPriority.High}
- Medium: ${report.byPriority.Medium}
- Low: ${report.byPriority.Low}

## Recommendations
${report.recommendations.map((r) => `- ${r}`).join("\n")}
  `.trim();
}
