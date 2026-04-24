// src/api/http/controllers/samples.controller.ts
import { NextFunction, Request, Response } from 'express';

export class SamplesController {
  constructor(private readonly pool: import('pg').Pool) {}

  /**
   * GET /api/samples
   * Optional query params:
   *   ?region=Gauteng
   *   ?organism=Escherichia+coli
   *   ?q=search+term          (matches sample_name, organism, isolation_source)
   *   ?limit=100&offset=0
   */
  listSamples = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { region, organism, q, limit = '200', offset = '0' } = req.query as Record<
        string,
        string | undefined
      >;

      const conditions: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (region) {
        // geo_loc_name contains the region name, e.g. "South Africa: Gauteng"
        conditions.push(`geo_loc_name ILIKE $${idx++}`);
        values.push(`%${region}%`);
      }

      if (organism) {
        conditions.push(`organism ILIKE $${idx++}`);
        values.push(`%${organism}%`);
      }

      if (q) {
        conditions.push(
          `(sample_name ILIKE $${idx} OR organism ILIKE $${idx} OR isolation_source ILIKE $${idx})`,
        );
        values.push(`%${q}%`);
        idx++;
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const limitNum  = Math.min(Math.max(parseInt(limit  ?? '200', 10), 1), 1000);
      const offsetNum = Math.max(parseInt(offset ?? '0',   10), 0);

      values.push(limitNum, offsetNum);

      const sql = `
        SELECT
          id,
          sample_name              AS "sampleName",
          sample_analysis_type     AS "analysisType",
          isolate_id               AS "isolateId",
          organism,
          lab_sample_id            AS "sampleId",
          isolation_source         AS "isolationSource",
          collection_date          AS "collectionDate",
          geo_loc_name             AS "geoLocName",
          latitude,
          longitude,
          collected_by             AS "collectedBy",
          amr_resistance_genes     AS "amrResistanceGenes",
          sequence_name            AS "sequenceName",
          element_type             AS "elementType",
          element_class            AS "amrClass",
          element_subclass         AS "subclass",
          pct_coverage_reference   AS "pctCoverage",
          pct_identity_reference   AS "pctIdentity",
          alignment_length         AS "alignmentLength",
          reference_sequence_length AS "refSeqLength",
          accession_closest_sequence AS "accession",
          virulence_genes          AS "virulenceGenes",
          plasmid_replicons        AS "plasmidReplicons",
          predicted_sir_profile    AS "predictedSirProfile",
          ph,
          water_temp_c             AS "tempWaterC",
          tds_mg_l                 AS "tdsMgL",
          dissolved_oxygen_mg_l    AS "dissolvedOxygenMgL",
          created_at               AS "createdAt"
        FROM samples
        ${where}
        ORDER BY created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}
      `;

      const { rows } = await this.pool.query(sql, values);

      // Parse the region label out of geo_loc_name ("South Africa: Gauteng" → "Gauteng")
      const parsed = rows.map((row) => {
        const geoLocName: string = row.geoLocName ?? '';
        const region = geoLocName.includes(':')
          ? geoLocName.split(':').pop()?.trim() ?? geoLocName
          : geoLocName;

        // Split pipe/semicolon/comma-delimited gene strings into arrays
        const splitGenes = (raw: string | null): string[] => {
          if (!raw) return [];
          return raw
            .split(/[;|,]+/)
            .map((g: string) => g.trim())
            .filter(Boolean);
        };

        return {
          ...row,
          region,
          amrGenes:        splitGenes(row.amrResistanceGenes),
          virulenceGenes:  splitGenes(row.virulenceGenes),
          plasmidReplicons: splitGenes(row.plasmidReplicons),
          predictedSir:    splitGenes(row.predictedSirProfile),
          // Ensure numeric types (pg returns strings for DECIMAL)
          latitude:           parseFloat(row.latitude)  ?? 0,
          longitude:          parseFloat(row.longitude) ?? 0,
          pctCoverage:        row.pctCoverage    != null ? parseFloat(row.pctCoverage)    : null,
          pctIdentity:        row.pctIdentity    != null ? parseFloat(row.pctIdentity)    : null,
          alignmentLength:    row.alignmentLength != null ? parseInt(row.alignmentLength)  : null,
          refSeqLength:       row.refSeqLength   != null ? parseInt(row.refSeqLength)     : null,
          ph:                 row.ph             != null ? parseFloat(row.ph)             : null,
          tempWaterC:         row.tempWaterC     != null ? parseFloat(row.tempWaterC)     : null,
          tdsMgL:             row.tdsMgL         != null ? parseFloat(row.tdsMgL)         : null,
          dissolvedOxygenMgL: row.dissolvedOxygenMgL != null ? parseFloat(row.dissolvedOxygenMgL) : null,
        };
      });

      res.status(200).json({ status: 'success', data: { samples: parsed, count: parsed.length } });
    } catch (error) {
      next(error as Error);
    }
  };

  /**
   * GET /api/samples/:id
   */
  getSample = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const { rows } = await this.pool.query(
        `SELECT
          id,
          sample_name              AS "sampleName",
          sample_analysis_type     AS "analysisType",
          isolate_id               AS "isolateId",
          organism,
          lab_sample_id            AS "sampleId",
          isolation_source         AS "isolationSource",
          collection_date          AS "collectionDate",
          geo_loc_name             AS "geoLocName",
          latitude,
          longitude,
          collected_by             AS "collectedBy",
          amr_resistance_genes     AS "amrResistanceGenes",
          sequence_name            AS "sequenceName",
          element_type             AS "elementType",
          element_class            AS "amrClass",
          element_subclass         AS "subclass",
          pct_coverage_reference   AS "pctCoverage",
          pct_identity_reference   AS "pctIdentity",
          alignment_length         AS "alignmentLength",
          reference_sequence_length AS "refSeqLength",
          accession_closest_sequence AS "accession",
          virulence_genes          AS "virulenceGenes",
          plasmid_replicons        AS "plasmidReplicons",
          predicted_sir_profile    AS "predictedSirProfile",
          ph,
          water_temp_c             AS "tempWaterC",
          tds_mg_l                 AS "tdsMgL",
          dissolved_oxygen_mg_l    AS "dissolvedOxygenMgL"
        FROM samples
        WHERE id = $1`,
        [id],
      );

      if (rows.length === 0) {
        res.status(404).json({ status: 'error', message: 'Sample not found.' });
        return;
      }

      res.status(200).json({ status: 'success', data: rows[0] });
    } catch (error) {
      next(error as Error);
    }
  };
}