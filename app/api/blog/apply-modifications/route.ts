import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';
import { supabase } from '@/lib/supabase/supabase-client';
import { PartialBlock } from '@blocknote/core';

interface Modification {
  type: 'replace' | 'insert' | 'delete' | 'update_title';
  target?: string;
  content?: string | PartialBlock[];
  title?: string;
}

function replaceContent(
  content: PartialBlock[],
  target: string,
  newContent: string | PartialBlock[]
): PartialBlock[] {
  const targetIndex = parseInt(target);
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= content.length) {
    return content;
  }

  const updated = [...content];
  if (typeof newContent === 'string') {
    updated[targetIndex] = {
      type: 'paragraph',
      content: [{ type: 'text', text: newContent }],
    } as PartialBlock;
  } else {
    updated[targetIndex] = newContent[0];
  }
  return updated;
}

function insertContent(
  content: PartialBlock[],
  target: string,
  newContent: string | PartialBlock[]
): PartialBlock[] {
  const targetIndex = parseInt(target);
  if (isNaN(targetIndex)) {
    return content;
  }

  const updated = [...content];
  const insertIndex = Math.max(0, Math.min(targetIndex, content.length));

  if (typeof newContent === 'string') {
    updated.splice(insertIndex, 0, {
      type: 'paragraph',
      content: [{ type: 'text', text: newContent }],
    } as PartialBlock);
  } else {
    updated.splice(insertIndex, 0, ...newContent);
  }
  return updated;
}

function deleteContent(content: PartialBlock[], target: string): PartialBlock[] {
  const targetIndex = parseInt(target);
  if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= content.length) {
    return content;
  }

  const updated = [...content];
  updated.splice(targetIndex, 1);
  return updated;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, modifications } = await req.json();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    let updatedContent = post.content as PartialBlock[];
    let updatedTitle = post.title;

    for (const mod of modifications as Modification[]) {
      switch (mod.type) {
        case 'replace':
          if (mod.target && mod.content) {
            updatedContent = replaceContent(updatedContent, mod.target, mod.content);
          }
          break;
        case 'insert':
          if (mod.target && mod.content) {
            updatedContent = insertContent(updatedContent, mod.target, mod.content);
          }
          break;
        case 'delete':
          if (mod.target) {
            updatedContent = deleteContent(updatedContent, mod.target);
          }
          break;
        case 'update_title':
          if (mod.title) {
            updatedTitle = mod.title;
          }
          break;
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title: updatedTitle,
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error('Apply modifications error:', error);
    return NextResponse.json(
      { error: 'Failed to apply modifications' },
      { status: 500 }
    );
  }
}
