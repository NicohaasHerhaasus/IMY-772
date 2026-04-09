import { Pool } from 'pg';

export type IsolateExplorerItem = {
  id: string;
  isolateName: string;
  qualityModule: string;
  sequenceType: string | null;
  genomeLength: number | null;
  n50Value: number | null;
  contigs: number | null;
  genotypes: Array<{
    id: string;
    geneName: string;
    identityPercentage: number | null;
    overlapPercentage: number | null;
    accessionId: string | null;
  }>;
  phenotypes: Array<{
    id: string;
    antibioticName: string;
  }>;
  plasmids: Array<{
    id: string;
    plasmidName: string;
    identityPercentage: number | null;
  }>;
};

export class IsolateService {
  constructor(private readonly pool: Pool) {}

  async listAll(): Promise<IsolateExplorerItem[]> {
    const result = await this.pool.query<IsolateExplorerItem>(`
      SELECT
        i.id AS "id",
        i.isolate_name AS "isolateName",
        i.quality_module AS "qualityModule",
        i.sequence_type AS "sequenceType",
        i.genome_length AS "genomeLength",
        i.n50_value AS "n50Value",
        i.contigs AS "contigs",
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', g.id,
              'geneName', g.gene_name,
              'identityPercentage', g.identity_percentage,
              'overlapPercentage', g.overlap_percentage,
              'accessionId', g.accession_id
            )
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'::jsonb
        ) AS "genotypes",
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', p.id,
              'antibioticName', p.antibiotic_name
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::jsonb
        ) AS "phenotypes",
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', pl.id,
              'plasmidName', pl.plasmid_name,
              'identityPercentage', pl.identity_percentage
            )
          ) FILTER (WHERE pl.id IS NOT NULL),
          '[]'::jsonb
        ) AS "plasmids"
      FROM isolates i
      LEFT JOIN isolate_genotypes g ON g.isolate_id = i.id
      LEFT JOIN isolate_phenotypes p ON p.isolate_id = i.id
      LEFT JOIN isolate_plasmids pl ON pl.isolate_id = i.id
      GROUP BY i.id
      ORDER BY i.isolate_name ASC;
    `);

    return result.rows;
  }
}

