export interface DocumentGenerationOptions {
  projectName: string;
  projectKey?: string;
  boardId?: string;
  platform: 'jira' | 'trello';
  documentType: 'report' | 'stories';
}

export interface GeneratedDocument {
  fileName: string;
  title: string;
  content: any[];
  metadata: Record<string, any>;
}

export function generateReportDocument(options: DocumentGenerationOptions): GeneratedDocument {
  const { projectName, projectKey, boardId, platform } = options;
  
  // Convert project name to kebab-case for file naming
  const kebabCaseName = projectName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  const fileName = `${kebabCaseName}-Report.md`;
  
  // Generate initial content structure for BlockNote
  const content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: `${projectName} Project Report` }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: `This is the project report for ${projectName}.` }
      ]
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Overview' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Provide a high-level overview of the project goals and objectives.' }
      ]
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Requirements' }]
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Functional requirements' }]
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Non-functional requirements' }]
    },
    {
      type: 'bulletListItem',
      content: [{ type: 'text', text: 'Technical constraints' }]
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Implementation Plan' }]
    },
    {
      type: 'numberedListItem',
      content: [{ type: 'text', text: 'Phase 1: Planning and Design' }]
    },
    {
      type: 'numberedListItem',
      content: [{ type: 'text', text: 'Phase 2: Development' }]
    },
    {
      type: 'numberedListItem',
      content: [{ type: 'text', text: 'Phase 3: Testing and Deployment' }]
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Notes' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Add any additional notes or considerations here.' }
      ]
    }
  ];

  const metadata = {
    created_from: 'document_generator',
    platform,
    project_name: projectName,
    ...(projectKey && { project_key: projectKey }),
    ...(boardId && { board_id: boardId }),
    generated_at: new Date().toISOString(),
  };

  return {
    fileName,
    title: `${projectName} Report`,
    content,
    metadata,
  };
}

export function generateStoriesDocument(options: DocumentGenerationOptions): GeneratedDocument {
  const { projectName, projectKey, boardId, platform } = options;
  
  // Convert project name to kebab-case for file naming
  const kebabCaseName = projectName.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const fileName = `${kebabCaseName}-${platformName}-Stories.md`;
  
  // Generate initial content structure for BlockNote
  const content = [
    {
      type: 'heading',
      props: { level: 1 },
      content: [{ type: 'text', text: `${projectName} ${platformName} Stories` }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: `User stories for ${projectName} project to be synced with ${platformName}.` }
      ]
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Story Template' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Use the following template for creating new stories:' }
      ]
    },
    {
      type: 'codeBlock',
      props: { language: 'markdown' },
      content: [
        { 
          type: 'text', 
          text: platform === 'jira' 
            ? `- Story: STORY-001 Story Title
  Description: Brief description of the story
  Acceptance_Criteria:
    - [ ] Criterion 1
    - [ ] Criterion 2
    - [ ] Criterion 3
  Priority: High
  Labels: [feature, backend]
  Assignees: developer@example.com
  Reporter: reporter@example.com`
            : `- Story: Story Title
  Description: Brief description of the story
  Acceptance_Criteria:
    - [ ] Criterion 1
    - [ ] Criterion 2
    - [ ] Criterion 3
  Priority: p1
  Labels: [feature, backend]
  Assignees: @developer`
        }
      ]
    },
    {
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'Stories' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Add your user stories below:' }
      ]
    }
  ];

  const metadata = {
    created_from: 'document_generator',
    platform,
    project_name: projectName,
    document_type: 'stories',
    ...(projectKey && { project_key: projectKey }),
    ...(boardId && { board_id: boardId }),
    generated_at: new Date().toISOString(),
  };

  return {
    fileName,
    title: `${projectName} ${platformName} Stories`,
    content,
    metadata,
  };
}

export function generateDocument(options: DocumentGenerationOptions): GeneratedDocument {
  if (options.documentType === 'report') {
    return generateReportDocument(options);
  } else {
    return generateStoriesDocument(options);
  }
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .toLowerCase();
}

export function generateUniqueFileName(baseName: string, existingNames: string[]): string {
  let fileName = baseName;
  let counter = 1;
  
  while (existingNames.includes(fileName)) {
    const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
    const extension = baseName.match(/\.[^/.]+$/)?.[0] || '';
    fileName = `${nameWithoutExt}-${counter}${extension}`;
    counter++;
  }
  
  return fileName;
}