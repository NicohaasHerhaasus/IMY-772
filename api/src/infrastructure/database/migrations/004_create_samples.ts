import { Pool } from 'pg';

/** For DBs that already had `samples` from an older 004 (CREATE IF NOT EXISTS skips). */
const OPTIONAL_SAMPLE_COLUMNS: Array<{ name: string; ddl: string }> = [
  { name: 'isolate_id', ddl: 'VARCHAR(255)' },
  { name: 'organism', ddl: 'VARCHAR(500)' },
  { name: 'lab_sample_id', ddl: 'VARCHAR(255)' },
  { name: 'collected_by', ddl: 'VARCHAR(255)' },
  { name: 'amr_resistance_genes', ddl: 'TEXT' },
  { name: 'sequence_name', ddl: 'VARCHAR(500)' },
  { name: 'element_type', ddl: 'VARCHAR(255)' },
  { name: 'element_class', ddl: 'VARCHAR(255)' },
  { name: 'element_subclass', ddl: 'VARCHAR(255)' },
  { name: 'target_length', ddl: 'INTEGER' },
  { name: 'reference_sequence_length', ddl: 'INTEGER' },
  { name: 'pct_coverage_reference', ddl: 'DECIMAL(12, 6)' },
  { name: 'pct_identity_reference', ddl: 'DECIMAL(12, 6)' },
  { name: 'alignment_length', ddl: 'INTEGER' },
  { name: 'accession_closest_sequence', ddl: 'VARCHAR(500)' },
  { name: 'virulence_genes', ddl: 'TEXT' },
  { name: 'plasmid_replicons', ddl: 'TEXT' },
  { name: 'ph', ddl: 'DECIMAL(10, 4)' },
  { name: 'water_temp_c', ddl: 'DECIMAL(10, 4)' },
  { name: 'tds_mg_l', ddl: 'DECIMAL(15, 6)' },
  { name: 'dissolved_oxygen_mg_l', ddl: 'DECIMAL(15, 6)' },
];

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS samples (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sample_name VARCHAR(255) NOT NULL,
        sample_analysis_type VARCHAR(255) NOT NULL,
        isolation_source VARCHAR(255) NOT NULL,
        collection_date VARCHAR(100) NOT NULL,
        geo_loc_name VARCHAR(255) NOT NULL,
        latitude DECIMAL(12, 7) NOT NULL,
        longitude DECIMAL(12, 7) NOT NULL,
        predicted_sir_profile VARCHAR(500) NOT NULL,
        isolate_id VARCHAR(255) NULL,
        organism VARCHAR(500) NULL,
        lab_sample_id VARCHAR(255) NULL,
        collected_by VARCHAR(255) NULL,
        amr_resistance_genes TEXT NULL,
        sequence_name VARCHAR(500) NULL,
        element_type VARCHAR(255) NULL,
        element_class VARCHAR(255) NULL,
        element_subclass VARCHAR(255) NULL,
        target_length INTEGER NULL,
        reference_sequence_length INTEGER NULL,
        pct_coverage_reference DECIMAL(12, 6) NULL,
        pct_identity_reference DECIMAL(12, 6) NULL,
        alignment_length INTEGER NULL,
        accession_closest_sequence VARCHAR(500) NULL,
        virulence_genes TEXT NULL,
        plasmid_replicons TEXT NULL,
        ph DECIMAL(10, 4) NULL,
        water_temp_c DECIMAL(10, 4) NULL,
        tds_mg_l DECIMAL(15, 6) NULL,
        dissolved_oxygen_mg_l DECIMAL(15, 6) NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_samples_sample_name
      ON samples (sample_name);
    `);

    for (const col of OPTIONAL_SAMPLE_COLUMNS) {
      await client.query(`
        ALTER TABLE samples
        ADD COLUMN IF NOT EXISTS ${col.name} ${col.ddl} NULL
      `);
    }

    await client.query('COMMIT');
    console.log('Migration 004_create_samples completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
