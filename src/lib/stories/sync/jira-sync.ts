/**
 * Jira Synchronization Module
 * Handles syncing Stories to Jira Issues with proper field mapping
 */

export interface JiraIssue {
  key?: string;
  id?: string;
  fields: {
    summary: string;
    description: any; // ADF format
    issuetype: {
      id: string;
      name: string;
    };
    project: {
      key: string;
    };
    priority?: {
      id: string;
      name: string;
    };
    labels?: string[];
    assignee?: {
      accountId: string;
    };
    reporter?: {
      accountId: string;
    };
    parent?: {
      key: string;
    };
  };
}

export interface JiraSubTask {
  summary: string;
  description: any;
  issuetype: {
    id: string;
    name: string;
  };
  parent: {
    key: string;
  };
  project: {
    key: string;
  };
}

export interface SyncResult {
  success: boolean;
  issueKey?: string;
  error?: string;
  subTasks?: {
    key: string;
    summary: string;
  }[];
}

export interface StoryData {
  title: string;
  description: string;
  priority: string;
  labels: string[];
  assignees: string[];
  reporter: string;
  acceptanceCriteria: string[];
}

/**
 * Parse Stories.md content to extract individual stories
 */
export function parseStoriesContent(content: string): StoryData[] {
  const stories: StoryData[] = [];
  const sections = content.split(/^- Story:/m).filter(section => section.trim());
  
  for (const section of sections) {
    const story = parseStorySection(section);
    if (story) {
      stories.push(story);
    }
  }
  
  return stories;
}

/**
 * Parse individual story section
 */
function parseStorySection(section: string): StoryData | null {
  const lines = section.split('\n');
  
  // Extract title (first line)
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
  
  // Extract reporter
  const reporterMatch = section.match(/Reporter:\s*(.+)/);
  const reporter = reporterMatch ? reporterMatch[1].trim() : '';
  
  // Extract acceptance criteria
  const criteriaMatch = section.match(/Acceptance_Criteria:\s*((?:\s*- \[[ x]\].*\n?)*)/);
  const acceptanceCriteria: string[] = [];
  
  if (criteriaMatch) {
    const criteriaText = criteriaMatch[1];
    const criteriaLines = criteriaText.split('\n').filter(line => line.trim().startsWith('- ['));
    acceptanceCriteria.push(...criteriaLines.map(line => line.trim().replace(/^- \[[ x]\]\s*/, '')));
  }
  
  return {
    title,
    description,
    priority,
    labels,
    assignees,
    reporter,
    acceptanceCriteria
  };
}

/**
 * Map Story fields to Jira Issue fields
 */
export function mapStoryToJiraIssue(
  story: StoryData,
  projectKey: string,
  issueTypeId: string,
  priorityMap: Record<string, string>,
  userMap: Record<string, string>
): JiraIssue {
  // Convert description to ADF format (placeholder - would use actual converter)
  const descriptionADF = {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: story.description
          }
        ]
      }
    ]
  };
  
  const issue: JiraIssue = {
    fields: {
      summary: story.title,
      description: descriptionADF,
      issuetype: {
        id: issueTypeId,
        name: 'Story'
      },
      project: {
        key: projectKey
      }
    }
  };
  
  // Map priority
  if (story.priority && priorityMap[story.priority.toLowerCase()]) {
    issue.fields.priority = {
      id: priorityMap[story.priority.toLowerCase()],
      name: story.priority
    };
  }
  
  // Map labels
  if (story.labels.length > 0) {
    issue.fields.labels = story.labels;
  }
  
  // Map assignee (first assignee)
  if (story.assignees.length > 0 && userMap[story.assignees[0]]) {
    issue.fields.assignee = {
      accountId: userMap[story.assignees[0]]
    };
  }
  
  // Map reporter
  if (story.reporter && userMap[story.reporter]) {
    issue.fields.reporter = {
      accountId: userMap[story.reporter]
    };
  }
  
  return issue;
}

/**
 * Create Sub-tasks from Acceptance Criteria
 */
export function createSubTasksFromCriteria(
  acceptanceCriteria: string[],
  parentKey: string,
  projectKey: string,
  subTaskTypeId: string
): JiraSubTask[] {
  return acceptanceCriteria.map(criteria => ({
    summary: criteria,
    description: {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: criteria
            }
          ]
        }
      ]
    },
    issuetype: {
      id: subTaskTypeId,
      name: 'Sub-task'
    },
    parent: {
      key: parentKey
    },
    project: {
      key: projectKey
    }
  }));
}

/**
 * Sync single story to Jira
 */
export async function syncStoryToJira(
  story: StoryData,
  jiraConfig: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
    issueTypeId: string;
    subTaskTypeId: string;
    priorityMap: Record<string, string>;
    userMap: Record<string, string>;
  }
): Promise<SyncResult> {
  try {
    // Map story to Jira issue
    const issue = mapStoryToJiraIssue(
      story,
      jiraConfig.projectKey,
      jiraConfig.issueTypeId,
      jiraConfig.priorityMap,
      jiraConfig.userMap
    );
    
    // Create main issue
    const createResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${jiraConfig.email}:${jiraConfig.apiToken}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(issue)
    });
    
    if (!createResponse.ok) {
      const error = await createResponse.text();
      return {
        success: false,
        error: `Failed to create issue: ${error}`
      };
    }
    
    const createdIssue = await createResponse.json();
    const issueKey = createdIssue.key;
    
    // Create sub-tasks for acceptance criteria
    const subTasks: { key: string; summary: string }[] = [];
    
    if (story.acceptanceCriteria.length > 0) {
      const jiraSubTasks = createSubTasksFromCriteria(
        story.acceptanceCriteria,
        issueKey,
        jiraConfig.projectKey,
        jiraConfig.subTaskTypeId
      );
      
      for (const subTask of jiraSubTasks) {
        try {
          const subTaskResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${jiraConfig.email}:${jiraConfig.apiToken}`)}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(subTask)
          });
          
          if (subTaskResponse.ok) {
            const createdSubTask = await subTaskResponse.json();
            subTasks.push({
              key: createdSubTask.key,
              summary: subTask.summary
            });
          }
        } catch (error) {
          console.error('Failed to create sub-task:', error);
        }
      }
    }
    
    return {
      success: true,
      issueKey,
      subTasks
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Batch sync multiple stories to Jira
 */
export async function syncStoriesToJira(
  stories: StoryData[],
  jiraConfig: any,
  onProgress?: (current: number, total: number, story: string) => void
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  
  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    
    if (onProgress) {
      onProgress(i + 1, stories.length, story.title);
    }
    
    const result = await syncStoryToJira(story, jiraConfig);
    results.push(result);
    
    // Add delay between requests to avoid rate limiting
    if (i < stories.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}