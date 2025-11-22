import { taskyDb } from '@/lib/supabase/tasky-db-client';

const newSystemPrompt = 'You are a helpful AI assistant with vision capabilities. You can see and analyze images provided by users. When comparing items or presenting structured data, ALWAYS use Markdown tables with proper formatting. Example:\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Data 1   | Data 2   |\n\nUse this format for all comparisons and structured information.';

async function updateSystemPrompts() {
  try {
    const { data, error } = await taskyDb
      .from('user_ai_settings')
      .update({ 
        system_prompt: newSystemPrompt,
        updated_at: new Date().toISOString()
      })
      .neq('system_prompt', newSystemPrompt)
      .select();

    if (error) {
      console.error('Error updating system prompts:', error);
      return;
    }

    console.log(`Updated ${data?.length || 0} user settings with new system prompt`);
    console.log('New system prompt:', newSystemPrompt);
  } catch (error) {
    console.error('Failed to update system prompts:', error);
  }
}

updateSystemPrompts();
