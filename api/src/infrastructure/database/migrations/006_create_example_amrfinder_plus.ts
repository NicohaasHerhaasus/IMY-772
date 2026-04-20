import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS example_amrfinder_plus (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_id VARCHAR(255) NOT NULL,
        protein_identifier TEXT NOT NULL,
        gene_symbol VARCHAR(255),
        sequence_name TEXT,
        scope VARCHAR(100),
        element_type VARCHAR(100),
        element_subtype VARCHAR(100),
        class VARCHAR(255),
        subclass VARCHAR(255),
        method VARCHAR(100),
        target_length INTEGER,
        reference_sequence_length INTEGER,
        pct_coverage_reference DECIMAL(8, 3),
        pct_identity_reference DECIMAL(8, 3),
        alignment_length INTEGER,
        accession_closest_sequence VARCHAR(255),
        name_closest_sequence TEXT,
        hmm_id VARCHAR(255),
        hmm_description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_example_amrfinder_plus_sample_id
      ON example_amrfinder_plus (sample_id);
    `);

    await client.query('COMMIT');
    console.log('Migration 006_create_example_amrfinder_plus completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
