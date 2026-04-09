import {
  CreateIsolateData,
  CreateIsolateGenotypeData,
  CreateIsolatePhenotypeData,
  CreateIsolatePlasmidData,
  Isolate,
  IsolateGenotype,
  IsolatePhenotype,
  IsolatePlasmid,
  UpdateIsolateData,
} from '../entities/isolate.entity';

export interface IIsolateRepository {
  createIsolate(data: CreateIsolateData): Promise<Isolate>;
  findIsolateById(id: string): Promise<Isolate | null>;
  findIsolateByName(isolateName: string): Promise<Isolate | null>;
  updateIsolate(id: string, data: UpdateIsolateData): Promise<Isolate | null>;
  deleteIsolate(id: string): Promise<boolean>;

  addGenotype(data: CreateIsolateGenotypeData): Promise<IsolateGenotype>;
  addPhenotype(data: CreateIsolatePhenotypeData): Promise<IsolatePhenotype>;
  addPlasmid(data: CreateIsolatePlasmidData): Promise<IsolatePlasmid>;
}
