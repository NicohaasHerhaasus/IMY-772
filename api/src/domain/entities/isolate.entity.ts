export interface Isolate {
  id: string;
  isolateName: string;
  qualityModule: 'Passed' | 'Failed';
  sequenceType: string | null;
  genomeLength: number | null;
  n50Value: number | null;
  contigs: number | null;
}

export interface IsolateGenotype {
  id: string;
  isolateId: string;
  geneName: string;
  identityPercentage: number | null;
  overlapPercentage: number | null;
  accessionId: string | null;
}

export interface IsolatePhenotype {
  id: string;
  isolateId: string;
  antibioticName: string;
}

export interface IsolatePlasmid {
  id: string;
  isolateId: string;
  plasmidName: string;
  identityPercentage: number | null;
}

export type CreateIsolateData = Omit<Isolate, 'id'>;
export type UpdateIsolateData = Partial<CreateIsolateData>;

export type CreateIsolateGenotypeData = Omit<IsolateGenotype, 'id'>;
export type CreateIsolatePhenotypeData = Omit<IsolatePhenotype, 'id'>;
export type CreateIsolatePlasmidData = Omit<IsolatePlasmid, 'id'>;
