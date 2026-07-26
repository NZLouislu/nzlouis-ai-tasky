import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { db } from '@/lib/db/connection';
import { userPlatformConfigs, storiesProjects, storiesDocuments } from '@/lib/db/schema/stories';
import { eq, and } from 'drizzle-orm';
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

    const configs = await db
      .select()
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, 'jira'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Jira configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    let jiraApiToken: string;
    try {
      jiraApiToken = decrypt(config.jiraApiTokenEncrypted!);
    } catch (error) {
      console.error('Failed to decrypt Jira API token:', error);
      return NextResponse.json(
        { error: 'Failed to decrypt credentials' },
        { status: 500 }
      );
    }

    try {
      const projectsResponse = await fetch(`${config.jiraUrl}/rest/api/3/project`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.jiraEmail}:${jiraApiToken}`).toString('base64')}`,
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
        jiraUrl: config.jiraUrl,
        configName: config.configName,
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

    const configs = await db
      .select()
      .from(userPlatformConfigs)
      .where(
        and(
          eq(userPlatformConfigs.userId, userId),
          eq(userPlatformConfigs.platform, 'jira'),
          eq(userPlatformConfigs.isActive, true),
        )
      );

    if (!configs || configs.length === 0) {
      return NextResponse.json(
        { error: 'No active Jira configuration found' },
        { status: 404 }
      );
    }

    const config = configs[0];

    const [project] = await db
      .insert(storiesProjects)
      .values({
        userId,
        platform: 'jira',
        platformProjectId: projectKey,
        projectName,
        googleAccountEmail: session?.user?.email || '',
        connectionStatus: 'connected',
        platformCredentials: {
          jira_url: config.jiraUrl,
          jira_email: config.jiraEmail,
          project_key: projectKey,
        },
        projectMetadata: {
          config_name: config.configName,
          created_from: 'api',
        },
      })
      .returning();

    const reportFileName = `${projectName.replace(/\s+/g, '-')}-Report.md`;
    const [reportDoc] = await db
      .insert(storiesDocuments)
      .values({
        projectId: project.id,
        documentType: 'report',
        fileName: reportFileName,
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
      .returning();

    const storiesFileName = `${projectName.replace(/\s+/g, '-')}-Jira-Stories.md`;
    await db
      .insert(storiesDocuments)
      .values({
        projectId: project.id,
        documentType: 'stories',
        fileName: storiesFileName,
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
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Jira project added successfully',
      project: {
        id: project.id,
        projectKey,
        projectName,
        platform: 'jira',
        createdAt: project.createdAt,
        reportDocument: reportDoc ? {
          id: reportDoc.id,
          fileName: reportDoc.fileName,
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
