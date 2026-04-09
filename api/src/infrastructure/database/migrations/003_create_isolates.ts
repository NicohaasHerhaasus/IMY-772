import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS isolates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        isolate_name VARCHAR(100) NOT NULL UNIQUE,
        quality_module VARCHAR(10) NOT NULL CHECK (quality_module IN ('Passed', 'Failed')),
        sequence_type VARCHAR(100),
        genome_length INTEGER,
        n50_value INTEGER,
        contigs INTEGER
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS isolate_genotypes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        isolate_id UUID NOT NULL REFERENCES isolates(id) ON DELETE CASCADE,
        gene_name VARCHAR(100) NOT NULL,
        identity_percentage DECIMAL(5,2) CHECK (identity_percentage >= 0 AND identity_percentage <= 100),
        overlap_percentage DECIMAL(5,2) CHECK (overlap_percentage >= 0 AND overlap_percentage <= 100),
        accession_id VARCHAR(100)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS isolate_phenotypes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        isolate_id UUID NOT NULL REFERENCES isolates(id) ON DELETE CASCADE,
        antibiotic_name VARCHAR(100) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS isolate_plasmids (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        isolate_id UUID NOT NULL REFERENCES isolates(id) ON DELETE CASCADE,
        plasmid_name VARCHAR(100) NOT NULL,
        identity_percentage DECIMAL(5,2) CHECK (identity_percentage >= 0 AND identity_percentage <= 100)
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_isolate_genotypes_isolate_id
      ON isolate_genotypes (isolate_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_isolate_phenotypes_isolate_id
      ON isolate_phenotypes (isolate_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_isolate_plasmids_isolate_id
      ON isolate_plasmids (isolate_id);
    `);

    await client.query('COMMIT');
    console.log('Migration 003_create_isolates completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
