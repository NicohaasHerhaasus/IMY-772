import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotent: only add the constraint if it doesn't already exist.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'samples_sample_name_unique'
            AND conrelid = 'samples'::regclass
        ) THEN
          ALTER TABLE samples
            ADD CONSTRAINT samples_sample_name_unique UNIQUE (sample_name);
        END IF;
      END $$;
    `);

    await client.query('COMMIT');
    console.log('Migration 005_samples_unique_constraint completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
