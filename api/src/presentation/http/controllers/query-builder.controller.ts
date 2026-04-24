import { NextFunction, Request, Response } from 'express';
import { QueryBuilderService, QueryBuilderFilters } from '../../../application/services/query-builder.service';

export class QueryBuilderController {
  constructor(private readonly queryBuilderService: QueryBuilderService) {}

  // GET /query-builder/options
  // Returns all distinct values for each dropdown — no auth needed for
  // read-only metadata, but add authMiddleware in routes if required.
  getDropdownOptions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const options = await this.queryBuilderService.getDropdownOptions();
      res.status(200).json({ status: 'success', data: options });
    } catch (error) {
      next(error as Error);
    }
  };

  // POST /query-builder/query
  // Body: QueryBuilderFilters
  // Returns summary stats + row data for the table
  runQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = this.extractFilters(req);
      const result = await this.queryBuilderService.query(filters);

      res.status(200).json({
        status: 'success',
        data: {
          matchRate: result.matchRate,
          isolatesReturned: result.totalCount,
          uniqueAmrGenes: result.uniqueAmrGenes,
          organisms: result.organisms,
          rows: result.rows,
        },
      });
    } catch (error) {
      next(error as Error);
    }
  };

  // POST /query-builder/export/csv
  exportCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = this.extractFilters(req);
      const buffer = await this.queryBuilderService.exportCsv(filters);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="query_results_${Date.now()}.csv"`,
      );
      res.status(200).send(buffer);
    } catch (error) {
      next(error as Error);
    }
  };

  // POST /query-builder/export/xlsx
  exportXlsx = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = this.extractFilters(req);
      const buffer = await this.queryBuilderService.exportXlsx(filters);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="query_results_${Date.now()}.xlsx"`,
      );
      res.status(200).send(buffer);
    } catch (error) {
      next(error as Error);
    }
  };

  // ── Private ──────────────────────────────────────────────────────────────

  private extractFilters(req: Request): QueryBuilderFilters {
    // Accept both body (POST) and query params (GET) for flexibility
    const src = { ...req.query, ...req.body } as Record<string, string>;

    return {
      geo_loc_name: src['geo_loc_name'] ?? '',
      collection_date_start: src['collection_date_start'] ?? '',
      collection_date_end: src['collection_date_end'] ?? '',
      collected_by: src['collected_by'],
      amr_resistance_gene: src['amr_resistance_gene'],
      predicted_sir_profile: src['predicted_sir_profile'],
      organism: src['organism'],
      isolation_source: src['isolation_source'],
      element_class: src['element_class'],
      element_subclass: src['element_subclass'],
    };
  }
}