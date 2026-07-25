import { Pool } from 'pg';
import 'dotenv/config';

const missingIndexes = [
  `CREATE INDEX IF NOT EXISTS idx_stories_document_position ON stories(document_id, position)`,
  `CREATE INDEX IF NOT EXISTS idx_task_boards_user ON task_boards(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_task_columns_board ON task_columns(board_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tag_assignment_tag ON task_tag_assignments(tag_id)`,
  `CREATE INDEX IF NOT EXISTS idx_task_tags_user ON task_tags(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_api_keys_user ON user_api_keys(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workspace_pages_workspace ON workspace_pages(workspace_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workspace_pages_parent ON workspace_pages(parent_id)`,
  `CREATE INDEX IF NOT EXISTS idx_workspaces_user ON workspaces(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_storage_files_user ON storage_files(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_storage_files_entity ON storage_files(entity_type, entity_id)`,
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 3 });

  for (const sql of missingIndexes) {
    try {
      await pool.query(sql);
      console.log(`✅ ${sql.slice(0, 90)}`);
    } catch (err: any) {
      console.error(`❌ ${err.message}`);
    }
  }

  await pool.end();
  console.log('\nDone!');
}
main();
