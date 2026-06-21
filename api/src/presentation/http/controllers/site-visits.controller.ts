import { NextFunction, Request, Response } from 'express';

export class SiteVisitsController {
  constructor(private readonly pool: import('pg').Pool) {}

  /**
   * GET /api/site-visits?isolateId=...
   * Returns visits derived from samples grouped by collection_date for an isolate identifier.
   */
  listVisits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { isolateId } = req.query as Record<string, string | undefined>;

      const values: unknown[] = [];
      let sql = `
        SELECT
          id,
          sample_name              AS "sampleName",
          isolate_id               AS "isolateId",
          collection_date          AS "collectionDate",
          geo_loc_name             AS "geoLocName",
          latitude,
          longitude,
          amr_resistance_genes     AS "amrResistanceGenes",
          predicted_sir_profile    AS "predictedSirProfile",
          created_at               AS "createdAt"
        FROM samples
      `;

      if (isolateId) {
        sql += ` WHERE isolate_id ILIKE $1 `;
        values.push(`%${isolateId}%`);
      }

      sql += ` ORDER BY collection_date ASC NULLS LAST, created_at ASC`;

      const { rows } = await this.pool.query(sql, values);

      // Normalize and group by collection_date (visit)
      const byDate: Record<string, any[]> = {};

      const splitGenes = (raw: string | null): string[] => {
        if (!raw) return [];
        return raw
          .split(/[;|,]+/)
          .map((g: string) => g.trim())
          .filter(Boolean);
      };

      for (const r of rows) {
        const dateKey = r.collectionDate ? String(r.collectionDate).slice(0, 10) : 'unknown';
        const sample = {
          id: r.id,
          sampleName: r.sampleName,
          collectionDate: r.collectionDate,
          geoLocName: r.geoLocName,
          latitude: r.latitude != null ? parseFloat(r.latitude) : null,
          longitude: r.longitude != null ? parseFloat(r.longitude) : null,
          amrGenes: splitGenes(r.amrResistanceGenes),
          predictedSir: splitGenes(r.predictedSirProfile),
        };

        byDate[dateKey] = byDate[dateKey] || [];
        byDate[dateKey].push(sample);
      }

      const visits = Object.keys(byDate)
        .sort()
        .map((dateKey) => {
          const samplesForVisit = byDate[dateKey];
          // derive visit risk (max of sample risks)
          const priority = ['mcr-1', 'blandm', 'blakpc', 'vana'];
          const riskOfSample = (s: any) => {
            const genes = Array.isArray(s.amrGenes) ? s.amrGenes.map((g: string) => String(g).toLowerCase()) : [];
            if (genes.some((g: string) => priority.some((p) => g.includes(p)))) return 'high';
            const geneCount = genes.length;
            if (geneCount >= 3) return 'high';
            if (geneCount >= 1) return 'medium';
            if (Array.isArray(s.predictedSir) ? s.predictedSir.includes('R') : String(s.predictedSir).toLowerCase().includes('resist')) return 'high';
            return 'low';
          };

          const risks = samplesForVisit.map(riskOfSample);
          let visitRisk: string = 'none';
          if (risks.includes('high')) visitRisk = 'high';
          else if (risks.includes('medium')) visitRisk = 'medium';
          else if (risks.includes('low')) visitRisk = 'low';

          return {
            visitDate: dateKey === 'unknown' ? null : dateKey,
            samples: samplesForVisit,
            visitRisk,
            sampleCount: samplesForVisit.length,
          };
        });

      res.status(200).json({ status: 'success', data: { visits, count: visits.length } });
    } catch (error) {
      next(error as Error);
    }
  };
}

export default SiteVisitsController;
