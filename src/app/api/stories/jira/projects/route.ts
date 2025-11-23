import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { taskyDb } from '@/lib/supabase/tasky-db-client';
import { decrypt } from '@/lib/encryption';
import { getUserIdFromRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Jira configuration
    const { data: configs, error: configError } = await taskyDb
      .from('user_platform_configs')
      .select('*')
      .eq('user_id', userId)
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

    const config = configs[0]; // Use the first active configuration

    // Decrypt API Token
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

    // Get Jira projects list
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

      // Filter and format project data
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
    const userId = getUserIdFromRequest(session?.user?.id, request);
    
    if (!userId) {
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

    // Get user's Jira configuration
    const { data: configs, error: configError } = await taskyDb
      .from('user_platform_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'jira')
      .eq('is_active', true);

    if (configError || !configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Jira configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    // Create Stories project record
    const { data: project, error: projectError } = await taskyDb
      .from('stories_projects')
      .insert({
        user_id: userId,
        platform: 'jira',
        platform_project_id: projectKey,
        project_name: projectName,
        google_account_email: session?.user?.email || '',
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

    // Create default Report document
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
                text: `# ${projectName} Project Report

This is the project report for ${projectName}.

## Overview

## Requirements

## Implementation Plan

## Notes
`
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

    // Create default Stories document
    const storiesFileName = `${projectName.replace(/\s+/g, '-')}-Jira-Stories.md`;
    const { data: storiesDoc, error: storiesError } = await taskyDb
      .from('stories_documents')
      .insert({
        project_id: project.id,
        document_type: 'stories',
        file_name: storiesFileName,
        title: `${projectName} Stories`,
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `# ${projectName} Jira Stories\n\nThis document contains user stories to be synced with Jira.\n\n## Epic: Feature A\n\n- Story: STORY-001 Implement Feature A\n  Description: As a user, I want to...\n  Acceptance_Criteria:\n    - [ ] Criteria 1\n    - [ ] Criteria 2\n  Priority: Medium\n  Labels: [feature-a]\n`
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

    if (storiesError) {
      console.error('Failed to create stories document:', storiesError);
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
}