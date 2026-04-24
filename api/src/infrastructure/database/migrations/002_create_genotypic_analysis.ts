import { Pool } from 'pg';

export async function runMigration(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS genotypic_analysis (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        up_culture_number TEXT NULL,
        isolate_number TEXT NULL,
        farm TEXT NULL,
        trip TEXT NULL,
        source TEXT NULL,
        sample_number TEXT NULL,
        ar_code TEXT NULL,
        isolate_number_secondary TEXT NULL,
        notes TEXT NULL,
        organism_identity TEXT NULL,
        owner TEXT NULL,
        inti1_positive TEXT NULL,
        inti2_positive TEXT NULL,
        inti3_positive TEXT NULL,
        ctx_m_gp1 TEXT NULL,
        ctx_m_gp9 TEXT NULL,
        ctx_m_gp8_25 TEXT NULL,
        tem TEXT NULL,
        shv TEXT NULL,
        oxa TEXT NULL,
        acc TEXT NULL,
        ebc TEXT NULL,
        dha TEXT NULL,
        cit TEXT NULL,
        fox TEXT NULL,
        mox TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_genotypic_analysis_up_culture_number
      ON genotypic_analysis (up_culture_number);
    `);

    await client.query('COMMIT');
    console.log('Migration 002_create_genotypic_analysis completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
