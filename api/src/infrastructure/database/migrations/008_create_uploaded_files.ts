import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('isolates', 'staramr', 'amrfinder-plus', 'amrfinder-plus-tsv', 'genotypic')),
        status VARCHAR(50) NOT NULL DEFAULT 'loaded' CHECK (status IN ('loaded', 'processing', 'error', 'validating')),
        row_count INTEGER DEFAULT 0,
        error_message TEXT,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        uploaded_by_user_id UUID,
        source_table VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_type
      ON uploaded_files (file_type);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at
      ON uploaded_files (uploaded_at);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_status
      ON uploaded_files (status);
    `);

    await client.query('COMMIT');
    console.log('Migration 008_create_uploaded_files completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
