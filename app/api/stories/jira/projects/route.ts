import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { decrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取用户的Jira配置
    const { data: configs, error: configError } = await taskyDb
      .from('user_platform_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'jira')
      .eq('is_active', true);

    if (configError) {
      console.error('Database error:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch Jira configurations' },
        { status: 500 }
      );
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Jira configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0]; // 使用第一个活跃配置

    // 解密API Token
    let jiraApiToken: string;
    try {
      jiraApiToken = decrypt(config.jira_api_token_encrypted);
    } catch (error) {
      console.error('Failed to decrypt Jira API token:', error);
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 500 }
      );
    }

    // 获取Jira项目列表
    try {
      const projectsResponse = await fetch(`${config.jira_url}/rest/api/3/project`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.jira_email}:${jiraApiToken}`).toString('base64')}`,
          'Accept': 'application/json',
        },
      });

      if (!projectsResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to fetch projects from Jira' },
          { status: 400 }
        );
      }

      const projects = await projectsResponse.json();

      // 过滤和格式化项目数据
      const formattedProjects = projects.map((project: any) => ({
        id: project.id,
        key: project.key,
        name: project.name,
        description: project.description || '',
        projectTypeKey: project.projectTypeKey,
        lead: project.lead?.displayName || '',
        avatarUrls: project.avatarUrls,
      }));

      return NextResponse.json({
        success: true,
        projects: formattedProjects,
        totalCount: formattedProjects.length,
        jiraUrl: config.jira_url,
        configName: config.config_name,
      });

    } catch (error) {
      console.error('Jira API error:', error);
      return NextResponse.json(
        { error: 'Failed to connect to Jira API' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get Jira projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { projectKey, projectName } = body;

    if (!projectKey || !projectName) {
      return NextResponse.json(
        { error: 'Missing required fields: projectKey, projectName' },
        { status: 400 }
      );
    }

    // 获取用户的Jira配置
    const { data: configs, error: configError } = await taskyDb
      .from('user_platform_configs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('platform', 'jira')
      .eq('is_active', true);

    if (configError || !configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Jira configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    // 创建Stories项目记录
    const { data: project, error: projectError } = await taskyDb
      .from('stories_projects')
      .insert({
        user_id: session.user.id,
        platform: 'jira',
        platform_project_id: projectKey,
        project_name: projectName,
        google_account_email: session.user.email || '',
        connection_status: 'connected',
        platform_credentials: {
          jira_url: config.jira_url,
          jira_email: config.jira_email,
          project_key: projectKey,
        },
        project_metadata: {
          config_name: config.config_name,
          created_from: 'api',
        },
      })
      .select('*')
      .single();

    if (projectError) {
      console.error('Database error:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project record' },
        { status: 500 }
      );
    }

    // 创建默认的Report文档
    const reportFileName = `${projectName.replace(/\s+/g, '-')}-Report.md`;
    const { data: reportDoc, error: reportError } = await taskyDb
      .from('stories_documents')
      .insert({
        project_id: project.id,
        document_type: 'report',
        file_name: reportFileName,
        title: `${projectName} Report`,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `# ${projectName} Project Report\n\nThis is the project report for ${projectName}.\n\n## Overview\n\n## Requirements\n\n## Implementation Plan\n\n## Notes\n`
              }
            ]
          }
        ],
        metadata: {
          created_from: 'api',
          project_key: projectKey,
        },
      })
      .select('*')
      .single();

    if (reportError) {
      console.error('Failed to create report document:', reportError);
    }

    return NextResponse.json({
      success: true,
      message: 'Jira project added successfully',
      project: {
        id: project.id,
        projectKey,
        projectName,
        platform: 'jira',
        createdAt: project.created_at,
        reportDocument: reportDoc ? {
          id: reportDoc.id,
          fileName: reportDoc.file_name,
          title: reportDoc.title,
        } : null,
      }
    });

  } catch (error) {
    console.error('Add Jira project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Fetch Jira projects for connected user
    // This would involve:
    // 1. Get user's Jira credentials from database
    // 2. Use Jira API to fetch projects
    // 3. Return project list

    return NextResponse.json({
      projects: [],
      message: 'Jira projects endpoint - implementation pending'
    });

  } catch (error) {
    console.error('Error fetching Jira projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, projectName } = await request.json();

    if (!projectId || !projectName) {
      return NextResponse.json(
        { error: 'Project ID and name are required' },
        { status: 400 }
      );
    }

    // TODO: Create project record in database
    // This would involve:
    // 1. Insert into stories_projects table
    // 2. Create default Report and Stories documents
    // 3. Return created project data

    return NextResponse.json({
      message: 'Project creation endpoint - implementation pending',
      projectId,
      projectName
    });

  } catch (error) {
    console.error('Error creating Jira project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}