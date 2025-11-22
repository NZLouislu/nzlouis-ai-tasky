export function generateStoryId(existingIds: string[]): string {
  let counter = 1;
  let id = `STORY-${counter.toString().padStart(3, "0")}`;

  while (existingIds.includes(id)) {
    counter++;
    id = `STORY-${counter.toString().padStart(3, "0")}`;
  }

  return id;
}

export function validateStoryId(id: string): boolean {
  const storyIdPattern = /^STORY-\d{3,}$/;
  return storyIdPattern.test(id);
}

export function extractStoryIds(markdown: string): string[] {
  const storyIdPattern = /- Story: (STORY-\d{3,})/g;
  const ids: string[] = [];
  let match;

  while ((match = storyIdPattern.exec(markdown)) !== null) {
    ids.push(match[1]);
  }

  return ids;
}

export function hasDuplicateIds(ids: string[]): boolean {
  return new Set(ids).size !== ids.length;
}

export function findDuplicateIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }

  return Array.from(duplicates);
}

export function addStoryIdToMarkdown(
  markdown: string,
  existingIds: string[]
): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  const usedIds = new Set(existingIds);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.match(/^- Story: (?!STORY-\d{3,})/)) {
      const newId = generateStoryId(Array.from(usedIds));
      usedIds.add(newId);
      result.push(line.replace(/^- Story: /, `- Story: ${newId} `));
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}
