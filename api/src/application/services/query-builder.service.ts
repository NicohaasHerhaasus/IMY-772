import { Pool } from 'pg';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';
import { ValidationError } from '../errors/app.errors';

// ── Types ──────────────────────────────────────────────────────────────────

export interface QueryBuilderFilters {
  /** Mandatory */
  geo_loc_name: string;
  collection_date_start: string; // ISO date string  e.g. "2024-01-01"
  collection_date_end: string;
  collected_by?: string;          // mandatory field but ALL is valid → omit filter

  /** AMR resistance gene — exact match against amr_resistance_genes text column */
  amr_resistance_gene?: string;   // "All genes" → omit

  /** Predicted SIR — stored in predicted_sir_profile */
  predicted_sir_profile?: string; // "Any antibiotic" → omit

  /** At least one required */
  organism?: string;              // "All" → omit
  isolation_source?: string;      // "All" → omit

  /** Optional */
  element_class?: string;
  element_subclass?: string;
}

export interface QueryBuilderResult {
  rows: Record<string, unknown>[];
  totalCount: number;
  uniqueAmrGenes: number;
  organisms: number;
  matchRate: number | null;        // % of DB rows that matched (based on geo filter)
}

export interface DropdownOptions {
  geoLocations: string[];
  collectors: string[];
  amrGenes: string[];
  sirProfiles: string[];
  organisms: string[];
  isolationSources: string[];
  elementClasses: string[];
  elementSubclasses: string[];
}

// Columns returned in the table / export (mirrors the screenshot's 28-field export)
const SELECT_COLUMNS = `
  sample_name,
  isolate_id,
  organism,
  isolation_source,
  collection_date,
  geo_loc_name,
  collected_by,
  amr_resistance_genes,
  element_class,
  element_subclass,
  element_type,
  sequence_name,
  virulence_genes,
  plasmid_replicons,
  predicted_sir_profile,
  lab_sample_id,
  sample_analysis_type,
  latitude,
  longitude,
  target_length,
  reference_sequence_length,
  pct_coverage_reference,
  pct_identity_reference,
  alignment_length,
  accession_closest_sequence,
  ph,
  water_temp_c,
  tds_mg_l,
  dissolved_oxygen_mg_l
`;

// ── Service ────────────────────────────────────────────────────────────────

export class QueryBuilderService {
  constructor(private readonly pool: Pool) {}

  // ── Dropdown population ──────────────────────────────────────────────────

  async getDropdownOptions(): Promise<DropdownOptions> {
    const client = await this.pool.connect();
    try {
      const [
        geoRes,
        collectorRes,
        amrRes,
        sirRes,
        organismRes,
        sourceRes,
        classRes,
        subclassRes,
      ] = await Promise.all([
        client.query<{ geo_loc_name: string }>(
          `SELECT DISTINCT geo_loc_name FROM samples WHERE geo_loc_name IS NOT NULL ORDER BY geo_loc_name`,
        ),
        client.query<{ collected_by: string }>(
          `SELECT DISTINCT collected_by FROM samples WHERE collected_by IS NOT NULL ORDER BY collected_by`,
        ),
        // AMR genes are stored as comma-separated text — unnest to get distinct values
        client.query<{ gene: string }>(`
          SELECT DISTINCT TRIM(gene) AS gene
          FROM samples,
               LATERAL unnest(string_to_array(amr_resistance_genes, ',')) AS gene
          WHERE amr_resistance_genes IS NOT NULL
            AND amr_resistance_genes <> ''
          ORDER BY gene
        `),
        client.query<{ predicted_sir_profile: string }>(
          `SELECT DISTINCT predicted_sir_profile FROM samples WHERE predicted_sir_profile IS NOT NULL AND predicted_sir_profile <> '' ORDER BY predicted_sir_profile`,
        ),
        client.query<{ organism: string }>(
          `SELECT DISTINCT organism FROM samples WHERE organism IS NOT NULL ORDER BY organism`,
        ),
        client.query<{ isolation_source: string }>(
          `SELECT DISTINCT isolation_source FROM samples WHERE isolation_source IS NOT NULL ORDER BY isolation_source`,
        ),
        client.query<{ element_class: string }>(
          `SELECT DISTINCT element_class FROM samples WHERE element_class IS NOT NULL AND element_class <> '' ORDER BY element_class`,
        ),
        client.query<{ element_subclass: string }>(
          `SELECT DISTINCT element_subclass FROM samples WHERE element_subclass IS NOT NULL AND element_subclass <> '' ORDER BY element_subclass`,
        ),
      ]);

      return {
        geoLocations: geoRes.rows.map((r) => r.geo_loc_name),
        collectors: collectorRes.rows.map((r) => r.collected_by),
        amrGenes: amrRes.rows.map((r) => r.gene),
        sirProfiles: sirRes.rows.map((r) => r.predicted_sir_profile),
        organisms: organismRes.rows.map((r) => r.organism),
        isolationSources: sourceRes.rows.map((r) => r.isolation_source),
        elementClasses: classRes.rows.map((r) => r.element_class),
        elementSubclasses: subclassRes.rows.map((r) => r.element_subclass),
      };
    } finally {
      client.release();
    }
  }

  // ── Core query builder ───────────────────────────────────────────────────

  async query(filters: QueryBuilderFilters): Promise<QueryBuilderResult> {
    this.validateFilters(filters);

    const { whereClause, params } = this.buildWhere(filters);

    const client = await this.pool.connect();
    try {
      // Total rows in the geo-filtered universe (for match rate)
      const geoParams = [filters.geo_loc_name];
      const { rows: geoCountRows } = await client.query<{ count: string }>(
        `SELECT COUNT(*) AS count FROM samples WHERE geo_loc_name = $1`,
        geoParams,
      );
      const geoTotal = parseInt(geoCountRows[0].count, 10);

      // Actual filtered query
      const { rows } = await client.query<Record<string, unknown>>(
        `SELECT ${SELECT_COLUMNS} FROM samples ${whereClause} ORDER BY collection_date DESC, sample_name ASC`,
        params,
      );

      // Unique AMR gene count across result set
      const allGenes = new Set<string>();
      for (const row of rows) {
        const raw = row['amr_resistance_genes'] as string | null;
        if (raw) {
          raw.split(',').forEach((g) => {
            const trimmed = g.trim();
            if (trimmed) allGenes.add(trimmed);
          });
        }
      }

      const uniqueOrganisms = new Set(rows.map((r) => r['organism']).filter(Boolean)).size;
      const matchRate = geoTotal > 0 ? Math.round((rows.length / geoTotal) * 100) : null;

      return {
        rows,
        totalCount: rows.length,
        uniqueAmrGenes: allGenes.size,
        organisms: uniqueOrganisms,
        matchRate,
      };
    } finally {
      client.release();
    }
  }

  // ── Export helpers ───────────────────────────────────────────────────────

  async exportCsv(filters: QueryBuilderFilters): Promise<Buffer> {
    const { rows } = await this.query(filters);
    if (rows.length === 0) return Buffer.from('');

    const parser = new Parser({ fields: Object.keys(rows[0]) });
    return Buffer.from(parser.parse(rows), 'utf-8');
  }

  async exportXlsx(filters: QueryBuilderFilters): Promise<Buffer> {
    const { rows } = await this.query(filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Query Results');

    if (rows.length === 0) {
      return Buffer.from(await workbook.xlsx.writeBuffer());
    }

    const columns = Object.keys(rows[0]);

    // Header row
    sheet.addRow(columns);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1B2A4A' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.commit();

    // Data rows
    for (const row of rows) {
      sheet.addRow(columns.map((col) => row[col] ?? ''));
    }

    // Auto-width columns (cap at 60)
    sheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 2, 60);
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private validateFilters(filters: QueryBuilderFilters): void {
    const errors: string[] = [];

    if (!filters.geo_loc_name?.trim()) {
      errors.push('geo_loc_name is required.');
    }
    if (!filters.collection_date_start?.trim()) {
      errors.push('collection_date_start is required.');
    }
    if (!filters.collection_date_end?.trim()) {
      errors.push('collection_date_end is required.');
    }

    if (filters.collection_date_start && filters.collection_date_end) {
      const start = new Date(filters.collection_date_start);
      const end = new Date(filters.collection_date_end);

      if (isNaN(start.getTime())) {
        errors.push('collection_date_start is not a valid date.');
      }
      if (isNaN(end.getTime())) {
        errors.push('collection_date_end is not a valid date.');
      }
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start > end) {
        errors.push('collection_date_start must be before or equal to collection_date_end.');
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  private buildWhere(filters: QueryBuilderFilters): {
    whereClause: string;
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    const p = () => {
      params.push(undefined as unknown); // placeholder replaced below
      return `$${params.length}`;
    };

    // ── Mandatory ──────────────────────────────────────────────────────────

    params.push(filters.geo_loc_name);
    conditions.push(`geo_loc_name = $${params.length}`);

    // collection_date is stored as VARCHAR("YYYY-MM-DD") — cast for range comparison
    params.push(filters.collection_date_start);
    conditions.push(`collection_date::date >= $${params.length}::date`);

    params.push(filters.collection_date_end);
    conditions.push(`collection_date::date <= $${params.length}::date`);

    if (filters.collected_by && filters.collected_by !== 'All') {
      params.push(filters.collected_by);
      conditions.push(`collected_by = $${params.length}`);
    }

    // ── AMR gene — substring match inside comma-separated text ────────────
    if (filters.amr_resistance_gene && filters.amr_resistance_gene !== 'All genes') {
      params.push(`%${filters.amr_resistance_gene}%`);
      conditions.push(`amr_resistance_genes ILIKE $${params.length}`);
    }

    // ── Predicted SIR ──────────────────────────────────────────────────────
    if (filters.predicted_sir_profile && filters.predicted_sir_profile !== 'Any antibiotic') {
      params.push(filters.predicted_sir_profile);
      conditions.push(`predicted_sir_profile = $${params.length}`);
    }

    // ── At least one required (applied as OR group if both present) ────────
    const atLeastOneClauses: string[] = [];

    if (filters.organism && filters.organism !== 'All') {
      params.push(filters.organism);
      atLeastOneClauses.push(`organism = $${params.length}`);
    }

    if (filters.isolation_source && filters.isolation_source !== 'All') {
      params.push(filters.isolation_source);
      atLeastOneClauses.push(`isolation_source = $${params.length}`);
    }

    if (atLeastOneClauses.length > 0) {
      conditions.push(`(${atLeastOneClauses.join(' OR ')})`);
    }

    // ── Optional ───────────────────────────────────────────────────────────
    if (filters.element_class) {
      params.push(filters.element_class);
      conditions.push(`element_class = $${params.length}`);
    }

    if (filters.element_subclass) {
      params.push(filters.element_subclass);
      conditions.push(`element_subclass = $${params.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereClause, params };
  }
}