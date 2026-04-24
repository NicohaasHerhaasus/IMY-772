import { NextFunction, Request, Response } from 'express';
import { IsolateService } from '../../../application/services/isolate.service';
import { ValidationError } from '../../../application/errors/app.errors';

function toCsvCell(value: unknown): string {
  const raw = value == null ? '' : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export class IsolatesController {
  constructor(private readonly isolateService: IsolateService) {}

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isolates = await this.isolateService.listAll();
      res.status(200).json({
        status: 'success',
        data: isolates,
      });
    } catch (error) {
      next(error as Error);
    }
  };

  exportAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const format = String(req.query.format ?? 'csv').toLowerCase();
      const isolates = await this.isolateService.listAll();

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="isolates-export.json"');
        res.status(200).send(JSON.stringify(isolates, null, 2));
        return;
      }

      if (format !== 'csv') {
        throw new ValidationError(['format must be "csv" or "json".']);
      }

      const headers = [
        'id',
        'isolateName',
        'qualityModule',
        'sequenceType',
        'genomeLength',
        'n50Value',
        'contigs',
        'genotypesCount',
        'phenotypesCount',
        'plasmidsCount',
      ];
      const lines = [headers.map(toCsvCell).join(',')];
      for (const row of isolates) {
        lines.push(
          [
            row.id,
            row.isolateName,
            row.qualityModule,
            row.sequenceType ?? '',
            row.genomeLength ?? '',
            row.n50Value ?? '',
            row.contigs ?? '',
            row.genotypes.length,
            row.phenotypes.length,
            row.plasmids.length,
          ]
            .map(toCsvCell)
            .join(','),
        );
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="isolates-export.csv"');
      res.status(200).send(lines.join('\n'));
    } catch (error) {
      next(error as Error);
    }
  };
}

