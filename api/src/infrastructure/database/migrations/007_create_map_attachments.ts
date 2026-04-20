import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS map_attachments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        display_name VARCHAR(500) NOT NULL,
        original_filename VARCHAR(500) NOT NULL,
        mime_type VARCHAR(255) NOT NULL,
        file_data BYTEA NOT NULL,
        uploaded_by VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT map_attachments_lat_range CHECK (latitude >= -90 AND latitude <= 90),
        CONSTRAINT map_attachments_lng_range CHECK (longitude >= -180 AND longitude <= 180)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_map_attachments_lat_lng
      ON map_attachments (latitude, longitude);
    `);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
