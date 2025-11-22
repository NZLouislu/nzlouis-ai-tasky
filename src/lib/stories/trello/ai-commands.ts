import { generateProgressReport } from "./analytics";
import { extractStoryIds, generateStoryId } from "./story-id";

export interface AICommand {
  type: string;
  description: string;
  pattern: RegExp;
  handler: (match: RegExpMatchArray, markdown: string) => string;
}

export const aiCommands: AICommand[] = [
  {
    type: "move_to_ready",
    description: "Move story to Ready list",
    pattern: /move\s+(?:story\s+)?(STORY-\d{3,})\s+to\s+ready/i,
    handler: (match, markdown) => {
      const storyId = match[1];
      return moveStoryToList(markdown, storyId, "Ready");
    },
  },
  {
    type: "move_to_in_progress",
    description: "Move story to In Progress list",
    pattern: /move\s+(?:story\s+)?(STORY-\d{3,})\s+to\s+(?:in\s+)?progress/i,
    handler: (match, markdown) => {
      const storyId = match[1];
      return moveStoryToList(markdown, storyId, "In Progress");
    },
  },
  {
    type: "move_to_done",
    description: "Move story to Done list",
    pattern: /move\s+(?:story\s+)?(STORY-\d{3,})\s+to\s+done/i,
    handler: (match, markdown) => {
      const storyId = match[1];
      return moveStoryToList(markdown, storyId, "Done");
    },
  },
  {
    type: "generate_progress_report",
    description: "Generate progress report",
    pattern: /generate\s+(?:a\s+)?progress\s+report/i,
    handler: (match, markdown) => {
      const report = generateProgressReport(markdown);
      return `
# Progress Report

**Total Stories**: ${report.totalStories}
**Completion**: ${report.completionPercentage}%

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

## Blocked Stories
${report.blockedStories.length > 0 ? report.blockedStories.map((s) => `- ${s.id}: ${s.title}`).join("\n") : "None"}

## High Priority Backlog
${report.highPriorityBacklog.length > 0 ? report.highPriorityBacklog.map((s) => `- ${s.id}: ${s.title}`).join("\n") : "None"}
      `.trim();
    },
  },
  {
    type: "add_story",
    description: "Add new story to Backlog",
    pattern: /add\s+(?:a\s+)?(?:new\s+)?story:?\s+(.+)/i,
    handler: (match, markdown) => {
      const title = match[1].trim();
      const existingIds = extractStoryIds(markdown);
      const newId = generateStoryId(existingIds);

      const newStory = `
- Story: ${newId} ${title}
  Description: 
  Acceptance_Criteria:
    - [ ] 
  Priority: Medium
  Labels: []
`;

      const backlogMatch = markdown.match(/## Backlog\n/);
      if (backlogMatch && backlogMatch.index !== undefined) {
        const insertPos = backlogMatch.index + backlogMatch[0].length;
        return (
          markdown.slice(0, insertPos) +
          newStory +
          markdown.slice(insertPos)
        );
      }

      return markdown + "\n## Backlog\n" + newStory;
    },
  },
  {
    type: "set_priority",
    description: "Set story priority",
    pattern: /set\s+(?:story\s+)?(STORY-\d{3,})\s+priority\s+to\s+(high|medium|low)/i,
    handler: (match, markdown) => {
      const storyId = match[1];
      const priority = match[2].charAt(0).toUpperCase() + match[2].slice(1);
      return updateStoryField(markdown, storyId, "Priority", priority);
    },
  },
  {
    type: "add_label",
    description: "Add label to story",
    pattern: /add\s+label\s+(\w+)\s+to\s+(?:story\s+)?(STORY-\d{3,})/i,
    handler: (match, markdown) => {
      const label = match[1];
      const storyId = match[2];
      return addLabelToStory(markdown, storyId, label);
    },
  },
  {
    type: "check_blocked",
    description: "Check for blocked stories",
    pattern: /(?:check|show|list)\s+blocked\s+stories/i,
    handler: (match, markdown) => {
      const report = generateProgressReport(markdown);
      if (report.blockedStories.length === 0) {
        return "No blocked stories found.";
      }
      return `Found ${report.blockedStories.length} blocked stories:\n${report.blockedStories.map((s) => `- ${s.id}: ${s.title}`).join("\n")}`;
    },
  },
];

export function detectAICommand(
  input: string,
  markdown: string
): { command: AICommand; result: string } | null {
  for (const command of aiCommands) {
    const match = input.match(command.pattern);
    if (match) {
      const result = command.handler(match, markdown);
      return { command, result };
    }
  }
  return null;
}

function moveStoryToList(
  markdown: string,
  storyId: string,
  targetList: string
): string {
  const lines = markdown.split("\n");
  let currentList = "";
  let storyStartIndex = -1;
  let storyEndIndex = -1;
  let storyLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^## (Backlog|Ready|In Progress|Done)$/)) {
      currentList = line.replace("## ", "");
    }

    if (line.includes(`Story: ${storyId}`)) {
      storyStartIndex = i;
      storyLines.push(line);

      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^- Story:/)) {
          storyEndIndex = j - 1;
          break;
        }
        if (lines[j].match(/^## /)) {
          storyEndIndex = j - 1;
          break;
        }
        storyLines.push(lines[j]);
      }

      if (storyEndIndex === -1) {
        storyEndIndex = lines.length - 1;
      }
      break;
    }
  }

  if (storyStartIndex === -1) {
    return markdown;
  }

  lines.splice(storyStartIndex, storyEndIndex - storyStartIndex + 1);

  let targetListIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === `## ${targetList}`) {
      targetListIndex = i;
      break;
    }
  }

  if (targetListIndex === -1) {
    lines.push(`\n## ${targetList}`);
    targetListIndex = lines.length - 1;
  }

  let insertIndex = targetListIndex + 1;
  for (let i = targetListIndex + 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) {
      break;
    }
    insertIndex = i + 1;
  }

  lines.splice(insertIndex, 0, ...storyLines);

  return lines.join("\n");
}

function updateStoryField(
  markdown: string,
  storyId: string,
  field: string,
  value: string
): string {
  const lines = markdown.split("\n");
  let inStory = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`Story: ${storyId}`)) {
      inStory = true;
      continue;
    }

    if (inStory) {
      if (lines[i].match(/^- Story:/)) {
        break;
      }

      if (lines[i].trim().startsWith(`${field}:`)) {
        lines[i] = `  ${field}: ${value}`;
        break;
      }
    }
  }

  return lines.join("\n");
}

function addLabelToStory(
  markdown: string,
  storyId: string,
  label: string
): string {
  const lines = markdown.split("\n");
  let inStory = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`Story: ${storyId}`)) {
      inStory = true;
      continue;
    }

    if (inStory) {
      if (lines[i].match(/^- Story:/)) {
        break;
      }

      if (lines[i].trim().startsWith("Labels:")) {
        const labelsMatch = lines[i].match(/Labels:\s*\[([^\]]*)\]/);
        if (labelsMatch) {
          const existingLabels = labelsMatch[1]
            .split(",")
            .map((l) => l.trim())
            .filter(Boolean);
          if (!existingLabels.includes(label)) {
            existingLabels.push(label);
            lines[i] = `  Labels: [${existingLabels.join(", ")}]`;
          }
        }
        break;
      }
    }
  }

  return lines.join("\n");
}

export function getAICommandSuggestions(): string[] {
  return aiCommands.map((cmd) => cmd.description);
}
