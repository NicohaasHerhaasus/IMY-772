import { Pool } from 'pg';
import * as XLSX from 'xlsx';
import { ValidationError } from '../errors/app.errors';

type SheetRow = Record<string, unknown>;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Match sheet tabs despite Excel/Cognito export differences (spacing, underscores, case). */
function sheetNameKey(name: string): string {
  return normalizeHeader(name);
}

function findWorksheet(workbook: XLSX.WorkBook, ...canonicalNames: string[]): XLSX.WorkSheet | undefined {
  const wanted = new Set(canonicalNames.map((n) => sheetNameKey(n)));
  for (const sheetName of workbook.SheetNames) {
    if (wanted.has(sheetNameKey(sheetName))) {
      return workbook.Sheets[sheetName];
    }
  }
  return undefined;
}

function getCellValue(row: SheetRow, headerAliases: string[]): string | null {
  const aliasSet = new Set(headerAliases.map(normalizeHeader));
  for (const [header, rawValue] of Object.entries(row)) {
    if (!aliasSet.has(normalizeHeader(header))) {
      continue;
    }
    if (rawValue === null || rawValue === undefined) {
      return null;
    }
    const asString = String(rawValue).trim();
    return asString.length > 0 ? asString : null;
  }
  return null;
}

function parseNullableInteger(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(/,/g, '').trim();
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseNullableDecimal(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace('%', '').replace(/,/g, '').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizePercentage(value: number | null): number | null {
  if (value === null) return null;
  const clamped = Math.min(100, Math.max(0, value));
  return Number(clamped.toFixed(2));
}

function toIsolateName(rawIsolateId: string | null): string | null {
  if (!rawIsolateId) return null;
  return rawIsolateId.replace(/_assembly\.fasta$/i, '').trim();
}

/** DB allows only Passed | Failed - map StarAMR / Excel variants. */
function normalizeQualityModule(raw: string | null): 'Passed' | 'Failed' {
  if (!raw) return 'Failed';
  const v = raw.trim().toLowerCase();
  if (v === 'passed' || v === 'pass' || v === 'ok' || v === 'yes' || v === 'true' || v === 'green') {
    return 'Passed';
  }
  if (v === 'failed' || v === 'fail' || v === 'no' || v === 'false' || v === 'red') {
    return 'Failed';
  }
  return 'Failed';
}

export class StarAmrUploadService {
  constructor(private readonly pool: Pool) {}

  async ingestWorkbook(buffer: Buffer): Promise<{
    isolatesCount: number;
    phenotypesCount: number;
    genotypesCount: number;
    plasmidsCount: number;
  }> {
    if (!buffer || buffer.length === 0) {
      throw new ValidationError(['Uploaded file is empty.']);
    }

    let workbook: XLSX.WorkBook;
    try {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } catch {
      throw new ValidationError(['Invalid .xlsx file.']);
    }

    const summarySheet = findWorksheet(workbook, 'Summary');
    const detailedSummarySheet = findWorksheet(workbook, 'Detailed_Summary', 'Detailed Summary');
    if (!summarySheet || !detailedSummarySheet) {
      const have = workbook.SheetNames.join(', ');
      throw new ValidationError([
        'StarAMR import expects a StarAMR results workbook: a Summary sheet and a Detailed_Summary sheet.',
        `Sheets in this file: ${have || '(none)'}`,
        'If this file is the UP genotypic / binary information table (University of Pretoria Culture number, etc.), choose upload type "Genotypic Analysis Excel (.xlsx)" instead - not StarAMR.',
      ]);
    }

    const summaryRows = XLSX.utils.sheet_to_json<SheetRow>(summarySheet, {
      defval: null,
      raw: false,
    });
    const detailedRows = XLSX.utils.sheet_to_json<SheetRow>(detailedSummarySheet, {
      defval: null,
      raw: false,
    });

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const isolateIdByName = new Map<string, string>();
      let phenotypesCount = 0;
      let genotypesCount = 0;
      let plasmidsCount = 0;

      for (const row of summaryRows) {
        const isolateName = toIsolateName(
          getCellValue(row, ['Isolate ID', 'IsolateID', 'Isolate']),
        );
        if (!isolateName) {
          continue;
        }

        if (isolateName.length > 100) {
          throw new ValidationError([
            `Isolate name exceeds 100 characters (database limit): "${isolateName.slice(0, 60)}…"`,
          ]);
        }

        const qualityModule = normalizeQualityModule(
          getCellValue(row, ['Quality Module', 'Quality', 'QC', 'QC Result']),
        );
        const sequenceType = getCellValue(row, ['Sequence Type', 'SequenceType']);
        const genomeLength = parseNullableInteger(
          getCellValue(row, ['Genome Length', 'GenomeLength']),
        );
        const n50Value = parseNullableInteger(getCellValue(row, ['N50', 'N50 Value', 'N50Value']));
        const contigs = parseNullableInteger(getCellValue(row, ['Contigs']));

        const result = await client.query<{ id: string }>(
          `
            INSERT INTO isolates (
              isolate_name, quality_module, sequence_type, genome_length, n50_value, contigs
            ) VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (isolate_name) DO UPDATE SET
              quality_module = EXCLUDED.quality_module,
              sequence_type = EXCLUDED.sequence_type,
              genome_length = EXCLUDED.genome_length,
              n50_value = EXCLUDED.n50_value,
              contigs = EXCLUDED.contigs
            RETURNING id
          `,
          [isolateName, qualityModule, sequenceType, genomeLength, n50Value, contigs],
        );

        const isolateId = result.rows[0].id;
        isolateIdByName.set(isolateName, isolateId);

        const predictedPhenotype = getCellValue(row, [
          'Predicted Phenotype',
          'PredictedPhenotype',
          'Phenotype',
        ]);
        if (!predictedPhenotype) {
          continue;
        }

        const antibiotics = predictedPhenotype
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0);

        for (const antibioticName of antibiotics) {
          await client.query(
            `
              INSERT INTO isolate_phenotypes (isolate_id, antibiotic_name)
              VALUES ($1, $2)
            `,
            [isolateId, antibioticName],
          );
          phenotypesCount += 1;
        }
      }

      for (const row of detailedRows) {
        const isolateName = toIsolateName(
          getCellValue(row, ['Isolate ID', 'IsolateID', 'Isolate']),
        );
        if (!isolateName) {
          continue;
        }

        const isolateId = isolateIdByName.get(isolateName);
        if (!isolateId) {
          throw new ValidationError([
            `Detailed_Summary contains isolate "${isolateName}" not present in Summary.`,
          ]);
        }

        const dataType = getCellValue(row, ['Data Type', 'DataType']);
        const dataValue = getCellValue(row, ['Data']);
        if (!dataType || !dataValue) {
          continue;
        }

        const identityPercentage = normalizePercentage(
          parseNullableDecimal(getCellValue(row, ['%Identity', 'Identity'])),
        );
        const overlapPercentage = normalizePercentage(
          parseNullableDecimal(getCellValue(row, ['%Overlap', 'Overlap'])),
        );
        const accessionId = getCellValue(row, ['Accession', 'Accession ID', 'AccessionID']);

        if (dataType === 'Resistance') {
          await client.query(
            `
              INSERT INTO isolate_genotypes (
                isolate_id, gene_name, identity_percentage, overlap_percentage, accession_id
              ) VALUES ($1, $2, $3, $4, $5)
            `,
            [isolateId, dataValue, identityPercentage, overlapPercentage, accessionId],
          );
          genotypesCount += 1;
          continue;
        }

        if (dataType === 'Plasmid') {
          await client.query(
            `
              INSERT INTO isolate_plasmids (
                isolate_id, plasmid_name, identity_percentage
              ) VALUES ($1, $2, $3)
            `,
            [isolateId, dataValue, identityPercentage],
          );
          plasmidsCount += 1;
        }
      }

      await client.query('COMMIT');
      return {
        isolatesCount: isolateIdByName.size,
        phenotypesCount,
        genotypesCount,
        plasmidsCount,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error && typeof error === 'object' && 'code' in error) {
        const pg = error as { code?: string; message?: string };
        if (pg.code === '23514') {
          throw new ValidationError([
            'A value did not match database rules (e.g. quality must be Passed/Failed).',
            pg.message ?? '',
          ]);
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
