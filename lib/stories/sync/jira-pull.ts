/**
 * Jira Bidirectional Sync Module
 * Handles pulling updates from Jira back to Stories documents
 */

export interface JiraIssueData {
  key: string;
  id: string;
  fields: {
    summary: string;
    description: any;
    status: {
      name: string;
      id: string;
    };
    priority: {
      name: string;
      id: string;
    };
    labels: string[];
    assignee?: {
      accountId: string;
      displayName: string;
    };
    reporter: {
      accountId: string;
      displayName: string;
    };
    updated: string;
    created: string;
    subtasks?: Array<{
      key: string;
      fields: {
        summary: string;
        status: {
          name: string;
        };
      };
    }>;
  };
}

export interface SyncConflict {
  field: string;
  localValue: any;
  remoteValue: any;
  resolution?: 'local' | 'remote' | 'merge';
}

export interface PullSyncResult {
  success: boolean;
  issuesUpdated: number;
  conflicts: SyncConflict[];
  error?: string;
}

/**
 * Fetch Issues from Jira by project
 */
export async function fetchJiraIssues(
  jiraConfig: {
    baseUrl: string;
    email: string;
    apiToken: string;
    projectKey: string;
  },
  lastSyncTime?: string
): Promise<JiraIssueData[]> {
  try {
    let jql = `project = ${jiraConfig.projectKey} AND issuetype = Story`;
    
    // Only fetch issues updated since last sync
    if (lastSyncTime) {
      jql += ` AND updated >= "${lastSyncTime}"`;
    }
    
    const response = await fetch(
      `${jiraConfig.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&expand=subtasks`,
      {
        headers: {
          'Authorization': `Basic ${btoa(`${jiraConfig.email}:${jiraConfig.apiToken}`)}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch issues: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.issues || [];
    
  } catch (error) {
    throw new Error(`Failed to fetch Jira issues: ${error}`);
  }
}

/**
 * Convert ADF descriptions back to Markdown
 */
export function convertADFToMarkdown(adf: any): string {
  if (!adf || !adf.content) return '';
  
  return adf.content.map((node: any) => {
    switch (node.type) {
      case 'paragraph':
        return node.content?.map((textNode: any) => textNode.text || '').join('') || '';
      case 'heading':
        const level = node.attrs?.level || 1;
        const text = node.content?.map((textNode: any) => textNode.text || '').join('') || '';
        return '#'.repeat(level) + ' ' + text;
      case 'codeBlock':
        const code = node.content?.[0]?.text || '';
        const language = node.attrs?.language || '';
        return '```' + language + '\n' + code + '\n```';
      case 'bulletList':
        return node.content?.map((item: any) => {
          const itemText = item.content?.[0]?.content?.[0]?.text || '';
          return '- ' + itemText;
        }).join('\n') || '';
      default:
        return '';
    }
  }).join('\n\n');
}

/**
 * Convert Jira issue to Story format
 */
export function convertJiraIssueToStory(issue: JiraIssueData): string {
  const description = convertADFToMarkdown(issue.fields.description);
  const labels = issue.fields.labels.join(', ');
  const assignee = issue.fields.assignee?.displayName || '';
  const reporter = issue.fields.reporter.displayName;
  
  // Convert subtasks to acceptance criteria
  const acceptanceCriteria = issue.fields.subtasks?.map(subtask => {
    const checked = subtask.fields.status.name === 'Done' ? 'x' : ' ';
    return `    - [${checked}] ${subtask.fields.summary}`;
  }).join('\n') || '';
  
  return `- Story: ${issue.fields.summary}
  Description: ${description}
  Acceptance_Criteria:
${acceptanceCriteria}
  Priority: ${issue.fields.priority.name}
  Labels: [${labels}]
  Assignees: ${assignee}
  Reporter: ${reporter}
  Jira_Key: ${issue.key}
  Status: ${issue.fields.status.name}
  Updated: ${issue.fields.updated}`;
}

/**
 * Detect conflicts between local and remote changes
 */
export function detectConflicts(
  localStory: string,
  remoteIssue: JiraIssueData,
  lastSyncTime: string
): SyncConflict[] {
  const conflicts: SyncConflict[] = [];
  
  // Parse local story
  const localTitle = localStory.match(/- Story: (.+)/)?.[1] || '';
  const localDescription = localStory.match(/Description: (.+?)(?=\n\s*Acceptance_Criteria:|$)/s)?.[1]?.trim() || '';
  const localPriority = localStory.match(/Priority: (\w+)/)?.[1] || '';
  
  // Compare with remote
  const remoteTitle = remoteIssue.fields.summary;
  const remoteDescription = convertADFToMarkdown(remoteIssue.fields.description);
  const remotePriority = remoteIssue.fields.priority.name;
  
  // Check if remote was updated after last sync
  const remoteUpdated = new Date(remoteIssue.fields.updated);
  const lastSync = new Date(lastSyncTime);
  const remoteIsNewer = remoteUpdated > lastSync;
  
  if (remoteIsNewer) {
    if (localTitle !== remoteTitle) {
      conflicts.push({
        field: 'title',
        localValue: localTitle,
        remoteValue: remoteTitle
      });
    }
    
    if (localDescription !== remoteDescription) {
      conflicts.push({
        field: 'description',
        localValue: localDescription,
        remoteValue: remoteDescription
      });
    }
    
    if (localPriority !== remotePriority) {
      conflicts.push({
        field: 'priority',
        localValue: localPriority,
        remoteValue: remotePriority
      });
    }
  }
  
  return conflicts;
}

/**
 * Update Stories.md with Jira changes
 */
export function updateStoriesWithJiraChanges(
  storiesContent: string,
  jiraIssues: JiraIssueData[],
  conflictResolutions: Record<string, SyncConflict[]> = {}
): string {
  let updatedContent = storiesContent;
  
  for (const issue of jiraIssues) {
    const jiraKey = issue.key;
    const storyPattern = new RegExp(
      `(- Story: [^\\n]+[\\s\\S]*?Jira_Key: ${jiraKey}[\\s\\S]*?)(?=\\n- Story:|$)`,
      'g'
    );
    
    const match = storyPattern.exec(storiesContent);
    if (match) {
      const existingStory = match[1];
      const conflicts = conflictResolutions[jiraKey] || [];
      
      // Apply conflict resolutions or use remote values
      let updatedStory = convertJiraIssueToStory(issue);
      
      for (const conflict of conflicts) {
        if (conflict.resolution === 'local') {
          // Keep local value - modify updatedStory accordingly
          switch (conflict.field) {
            case 'title':
              updatedStory = updatedStory.replace(
                /- Story: .+/,
                `- Story: ${conflict.localValue}`
              );
              break;
            case 'description':
              updatedStory = updatedStory.replace(
                /Description: .+?(?=\n\s*Acceptance_Criteria:)/s,
                `Description: ${conflict.localValue}`
              );
              break;
            case 'priority':
              updatedStory = updatedStory.replace(
                /Priority: \w+/,
                `Priority: ${conflict.localValue}`
              );
              break;
          }
        }
        // For 'remote' resolution, we already have remote values in updatedStory
      }
      
      updatedContent = updatedContent.replace(existingStory, updatedStory);
    } else {
      // New issue from Jira - add to end
      const newStory = convertJiraIssueToStory(issue);
      updatedContent += '\n\n' + newStory;
    }
  }
  
  return updatedContent;
}

/**
 * Perform incremental sync (only changed stories)
 */
export async function performIncrementalSync(
  documentId: string,
  jiraConfig: any,
  lastSyncTime: string
): Promise<PullSyncResult> {
  try {
    // Fetch only issues updated since last sync
    const updatedIssues = await fetchJiraIssues(jiraConfig, lastSyncTime);
    
    if (updatedIssues.length === 0) {
      return {
        success: true,
        issuesUpdated: 0,
        conflicts: []
      };
    }
    
    // Get current document content
    // This would need to be implemented with actual Supabase call
    const currentContent = ''; // Placeholder
    
    // Detect conflicts
    const allConflicts: SyncConflict[] = [];
    for (const issue of updatedIssues) {
      const conflicts = detectConflicts(currentContent, issue, lastSyncTime);
      allConflicts.push(...conflicts);
    }
    
    // If there are conflicts, return them for user resolution
    if (allConflicts.length > 0) {
      return {
        success: false,
        issuesUpdated: 0,
        conflicts: allConflicts,
        error: 'Conflicts detected - user resolution required'
      };
    }
    
    // Update content with Jira changes
    const updatedContent = updateStoriesWithJiraChanges(currentContent, updatedIssues);
    
    // Save updated content
    // This would need to be implemented with actual Supabase call
    
    return {
      success: true,
      issuesUpdated: updatedIssues.length,
      conflicts: []
    };
    
  } catch (error) {
    return {
      success: false,
      issuesUpdated: 0,
      conflicts: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}