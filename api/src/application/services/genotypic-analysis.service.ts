import { Pool } from 'pg';
import { ValidationError } from '../errors/app.errors';

type UploadRow = Record<string, string | null | undefined>;

const MAX_ROWS_PER_UPLOAD = 5000;

function normalizeValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class GenotypicAnalysisService {
  constructor(private readonly pool: Pool) {}

  async uploadRows(rows: UploadRow[]): Promise<{ insertedCount: number }> {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new ValidationError(['rows must contain at least one TSV row.']);
    }

    if (rows.length > MAX_ROWS_PER_UPLOAD) {
      throw new ValidationError([`rows exceeds maximum of ${MAX_ROWS_PER_UPLOAD} rows per upload.`]);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const row of rows) {
        await client.query(
          `
            INSERT INTO genotypic_analysis (
              up_culture_number,
              isolate_number,
              farm,
              trip,
              source,
              sample_number,
              ar_code,
              isolate_number_secondary,
              notes,
              organism_identity,
              owner,
              inti1_positive,
              inti2_positive,
              inti3_positive,
              ctx_m_gp1,
              ctx_m_gp9,
              ctx_m_gp8_25,
              tem,
              shv,
              oxa,
              acc,
              ebc,
              dha,
              cit,
              fox,
              mox
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
              $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
            );
          `,
          [
            normalizeValue(row.upCultureNumber),
            normalizeValue(row.isolateNumber),
            normalizeValue(row.farm),
            normalizeValue(row.trip),
            normalizeValue(row.source),
            normalizeValue(row.sampleNumber),
            normalizeValue(row.arCode),
            normalizeValue(row.isolateNumberSecondary),
            normalizeValue(row.notes),
            normalizeValue(row.organismIdentity),
            normalizeValue(row.owner),
            normalizeValue(row.intI1Positive),
            normalizeValue(row.intI2Positive),
            normalizeValue(row.intI3Positive),
            normalizeValue(row.ctxMGp1),
            normalizeValue(row.ctxMGp9),
            normalizeValue(row.ctxMGp825),
            normalizeValue(row.tem),
            normalizeValue(row.shv),
            normalizeValue(row.oxa),
            normalizeValue(row.acc),
            normalizeValue(row.ebc),
            normalizeValue(row.dha),
            normalizeValue(row.cit),
            normalizeValue(row.fox),
            normalizeValue(row.mox),
          ],
        );
      }

      await client.query('COMMIT');
      return { insertedCount: rows.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
