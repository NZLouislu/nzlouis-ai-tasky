/**
 * Trello Synchronization Module
 * Handles syncing Stories to Trello Cards with proper field mapping
 */

export interface TrelloBoard {
  id: string;
  name: string;
  url: string;
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
}

export interface TrelloCardData {
  name: string;
  desc: string;
  idList: string;
  labels?: string[];
  idMembers?: string[];
  due?: string;
  pos?: number;
}

export interface TrelloSyncResult {
  success: boolean;
  cardId?: string;
  cardUrl?: string;
  error?: string;
  checklistsCreated?: number;
}

/**
 * Parse Stories.md content to extract individual stories for Trello
 */
export function parseStoriesForTrello(content: string): Array<{
  title: string;
  description: string;
  priority: string;
  labels: string[];
  assignees: string[];
  acceptanceCriteria: { text: string; checked: boolean }[];
  dueDate?: string;
}> {
  const stories: any[] = [];
  const sections = content.split(/^- Story:/m).filter(section => section.trim());
  
  for (const section of sections) {
    const story = parseStoryForTrello(section);
    if (story) {
      stories.push(story);
    }
  }
  
  return stories;
}

function parseStoryForTrello(section: string): any {
  const lines = section.split('\n');
  
  // Extract title
  const titleMatch = lines[0]?.match(/^(.+?)$/);
  if (!titleMatch) return null;
  
  const title = titleMatch[1].trim();
  
  // Extract description
  const descMatch = section.match(/Description:\s*(.+?)(?=\n\s*Acceptance_Criteria:|$)/s);
  const description = descMatch ? descMatch[1].trim() : '';
  
  // Extract priority
  const priorityMatch = section.match(/Priority:\s*(\w+)/);
  const priority = priorityMatch ? priorityMatch[1] : 'Medium';
  
  // Extract labels
  const labelsMatch = section.match(/Labels:\s*\[([^\]]+)\]/);
  const labels = labelsMatch ? labelsMatch[1].split(',').map(l => l.trim()) : [];
  
  // Extract assignees
  const assigneesMatch = section.match(/Assignees:\s*(.+)/);
  const assignees = assigneesMatch ? assigneesMatch[1].split(',').map(a => a.trim()) : [];
  
  // Extract due date
  const dueDateMatch = section.match(/Due:\s*(\d{4}-\d{2}-\d{2})/);
  const dueDate = dueDateMatch ? dueDateMatch[1] : undefined;
  
  // Extract acceptance criteria
  const criteriaMatch = section.match(/Acceptance_Criteria:\s*((?:\s*- \[[ x]\].*\n?)*)/);
  const acceptanceCriteria: { text: string; checked: boolean }[] = [];
  
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1];
    const criteriaLines = criteriaText.split('\n').filter(line => line.trim().startsWith('- ['));
    acceptanceCriteria.push(...criteriaLines.map(line => {
      const text = line.trim().replace(/^- \[[ x]\]\s*/, '');
      const checked = line.includes('[x]');
      return { text, checked };
    }));
  }
  
  return {
    title,
    description,
    priority,
    labels,
    assignees,
    acceptanceCriteria,
    dueDate
  };
}

/**
 * Fetch board labels via Trello API
 */
export async function getBoardLabels(
  boardId: string,
  trelloConfig: { key: string; token: string }
): Promise<TrelloLabel[]> {
  try {
    const response = await fetch(
      `https://api.trello.com/1/boards/${boardId}/labels?key=${trelloConfig.key}&token=${trelloConfig.token}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch labels: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get board labels: ${error}`);
  }
}

/**
 * Create missing labels on board
 */
export async function createBoardLabel(
  boardId: string,
  labelName: string,
  color: string,
  trelloConfig: { key: string; token: string }
): Promise<TrelloLabel> {
  try {
    const response = await fetch(
      `https://api.trello.com/1/boards/${boardId}/labels?key=${trelloConfig.key}&token=${trelloConfig.token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: labelName,
          color: color
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to create label: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to create label: ${error}`);
  }
}

/**
 * Fetch board members via Trello API
 */
export async function getBoardMembers(
  boardId: string,
  trelloConfig: { key: string; token: string }
): Promise<TrelloMember[]> {
  try {
    const response = await fetch(
      `https://api.trello.com/1/boards/${boardId}/members?key=${trelloConfig.key}&token=${trelloConfig.token}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to get board members: ${error}`);
  }
}

/**
 * Resolve member aliases to Trello member IDs
 */
export function resolveMemberAliases(
  assignees: string[],
  members: TrelloMember[],
  memberAliasMap: Record<string, string>
): string[] {
  const memberIds: string[] = [];
  
  for (const assignee of assignees) {
    // Try direct username match
    const directMatch = members.find(m => 
      m.username.toLowerCase() === assignee.toLowerCase() ||
      m.fullName.toLowerCase() === assignee.toLowerCase()
    );
    
    if (directMatch) {
      memberIds.push(directMatch.id);
      continue;
    }
    
    // Try alias mapping
    const aliasUsername = memberAliasMap[assignee.toLowerCase()];
    if (aliasUsername) {
      const aliasMatch = members.find(m => 
        m.username.toLowerCase() === aliasUsername.toLowerCase()
      );
      if (aliasMatch) {
        memberIds.push(aliasMatch.id);
      }
    }
  }
  
  return memberIds;
}

/**
 * Map priority to Trello label using priority label map
 */
export function mapPriorityToLabel(
  priority: string,
  labels: TrelloLabel[],
  priorityLabelMap: Record<string, string>
): string | undefined {
  const priorityLabel = priorityLabelMap[priority.toLowerCase()];
  if (!priorityLabel) return undefined;
  
  const label = labels.find(l => l.name.toLowerCase() === priorityLabel.toLowerCase());
  return label?.id;
}

/**
 * Create Trello card from story data
 */
export async function createTrelloCard(
  story: any,
  boardId: string,
  listId: string,
  trelloConfig: { key: string; token: string },
  options: {
    labels: TrelloLabel[];
    members: TrelloMember[];
    priorityLabelMap: Record<string, string>;
    memberAliasMap: Record<string, string>;
  }
): Promise<TrelloSyncResult> {
  try {
    // Resolve labels
    const labelIds: string[] = [];
    
    // Add priority label
    const priorityLabelId = mapPriorityToLabel(story.priority, options.labels, options.priorityLabelMap);
    if (priorityLabelId) {
      labelIds.push(priorityLabelId);
    }
    
    // Add story labels
    for (const labelName of story.labels) {
      const label = options.labels.find(l => l.name.toLowerCase() === labelName.toLowerCase());
      if (label) {
        labelIds.push(label.id);
      }
    }
    
    // Resolve members
    const memberIds = resolveMemberAliases(story.assignees, options.members, options.memberAliasMap);
    
    // Create card data
    const cardData: TrelloCardData = {
      name: story.title,
      desc: story.description,
      idList: listId,
      labels: labelIds.length > 0 ? labelIds : undefined,
      idMembers: memberIds.length > 0 ? memberIds : undefined,
      due: story.dueDate ? new Date(story.dueDate).toISOString() : undefined
    };
    
    // Create card
    const response = await fetch(
      `https://api.trello.com/1/cards?key=${trelloConfig.key}&token=${trelloConfig.token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData)
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create card: ${error}`);
    }
    
    const createdCard = await response.json();
    
    // Create checklists for acceptance criteria
    let checklistsCreated = 0;
    if (story.acceptanceCriteria.length > 0) {
      checklistsCreated = await createCardChecklists(
        createdCard.id,
        story.acceptanceCriteria,
        trelloConfig
      );
    }
    
    return {
      success: true,
      cardId: createdCard.id,
      cardUrl: createdCard.url,
      checklistsCreated
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create checklists for acceptance criteria
 */
async function createCardChecklists(
  cardId: string,
  acceptanceCriteria: any[],
  trelloConfig: { key: string; token: string }
): Promise<number> {
  try {
    // Create checklist
    const checklistResponse = await fetch(
      `https://api.trello.com/1/checklists?key=${trelloConfig.key}&token=${trelloConfig.token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idCard: cardId,
          name: 'Acceptance Criteria'
        })
      }
    );
    
    if (!checklistResponse.ok) {
      throw new Error('Failed to create checklist');
    }
    
    const checklist = await checklistResponse.json();
    
    // Add checklist items
    for (const criteria of acceptanceCriteria) {
      await fetch(
        `https://api.trello.com/1/checklists/${checklist.id}/checkItems?key=${trelloConfig.key}&token=${trelloConfig.token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: criteria.text,
            checked: criteria.checked || false
          })
        }
      );
    }
    
    return 1;
    
  } catch (error) {
    console.error('Failed to create checklists:', error);
    return 0;
  }
}

/**
 * Batch sync multiple stories to Trello
 */
export async function syncStoriesToTrello(
  stories: any[],
  trelloConfig: {
    key: string;
    token: string;
    boardId: string;
    listId: string;
    priorityLabelMap: Record<string, string>;
    memberAliasMap: Record<string, string>;
  },
  onProgress?: (current: number, total: number, story: string) => void
): Promise<TrelloSyncResult[]> {
  const results: TrelloSyncResult[] = [];
  
  // Fetch board data
  const [labels, members] = await Promise.all([
    getBoardLabels(trelloConfig.boardId, trelloConfig),
    getBoardMembers(trelloConfig.boardId, trelloConfig)
  ]);
  
  const options = {
    labels,
    members,
    priorityLabelMap: trelloConfig.priorityLabelMap,
    memberAliasMap: trelloConfig.memberAliasMap
  };
  
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    
    if (onProgress) {
      onProgress(i + 1, stories.length, story.title);
    }
    
    const result = await createTrelloCard(
      story,
      trelloConfig.boardId,
      trelloConfig.listId,
      trelloConfig,
      options
    );
    
    results.push(result);
    
    // Add delay between requests to avoid rate limiting
    if (i < stories.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}