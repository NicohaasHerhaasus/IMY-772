import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS uploaded_datafiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_type VARCHAR(32) NOT NULL,
        source_ref_id UUID NULL,
        upload_channel VARCHAR(64) NOT NULL,
        display_name VARCHAR(500) NOT NULL,
        original_filename VARCHAR(500) NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        uploaded_by VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uploaded_datafiles_source_type_check
          CHECK (source_type IN ('structured_upload', 'map_pin'))
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_datafiles_created_at
      ON uploaded_datafiles (created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_datafiles_source
      ON uploaded_datafiles (source_type, source_ref_id);
    `);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
