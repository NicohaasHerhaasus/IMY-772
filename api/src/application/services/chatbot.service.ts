import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { AppError, ValidationError } from '../errors/app.errors';

const MODEL_ID = 'us.anthropic.claude-haiku-4-5-20251001-v1:0';

const SYSTEM_PROMPT = `You are the AMR Surveillance Dashboard Assistant. Help users understand and use the AMR Surveillance Dashboard and answer questions about Antimicrobial Resistance (AMR) concepts.

You can answer questions about:
- Dashboard features: uploading sample data, viewing isolates, genotypic analysis results, map views, filtering and searching data
- AMR resistance genes: gene families (blaCTX-M, blaTEM, aph, tet, sul, fosA, bleO, mcr, etc.), element types, classes and subclasses
- SIR profiles (Susceptible/Intermediate/Resistant) and predicted antibiotic resistance
- Sequence metrics: pct_coverage, pct_identity, alignment length, reference sequence length, accession numbers
- Virulence genes (eae, hlyA, iucA, iroN, stx, etc.) and their clinical significance
- Plasmid replicons and mobile genetic elements (IncFIB, IncI1, Col, transposons, integrons)
- Water quality and environmental parameters: pH, temperature, TDS, dissolved oxygen, conductivity
- MLST typing, genome sequencing, organism identification and epidemiology
- How to interpret data shown in the dashboard
- Common errors or workflows within the application

Keep responses short — 2 to 4 sentences maximum. Only use a bullet list if there are 3 or more distinct items that genuinely benefit from listing. Use **bold** for key terms only. Do not speculate beyond established AMR science or documented dashboard functionality.`;

const TOPIC_KEYWORDS = [
  // Dashboard features
  'dashboard', 'upload', 'sample', 'isolate', 'filter', 'map',
  'chart', 'export', 'admin', 'user', 'report', 'analysis',
  'genotypic', 'phenotypic', 'workbook', 'xlsx',
  // AMR domain — core
  'amr', 'antimicrobial', 'resistance', 'resistant', 'susceptible',
  'intermediate', 'sir', 'antibiotic', 'gene', 'mlst', 'genome',
  'sequence', 'organism', 'bacteria', 'pathogen', 'surveillance',
  'mic', 'breakpoint', 'staramr', 'resfinder', 'pointfinder',
  'minimum inhibitory', 'predicted_sir', 'element_type',
  // Resistance gene classes & subclasses
  'aminoglycoside', 'beta-lactam', 'beta lactam', 'lactamase',
  'tetracycline', 'fosfomycin', 'bleomycin', 'fluoroquinolone',
  'carbapenem', 'colistin', 'macrolide', 'sulfonamide', 'trimethoprim',
  'vancomycin', 'kanamycin', 'ampicillin', 'ceftriaxone',
  // Resistance gene names / families
  'bla', 'ctx-m', 'ctx', 'tem', 'shv', 'oxa', 'kpc', 'ndm', 'vim', 'imp',
  'aph', 'aac', 'ant', 'rmta', 'mcr', 'qnr', 'tet', 'sul', 'dfr',
  'fosa', 'bleo', 'pbp', 'meca', 'vana',
  // Plasmid replicons & mobile elements
  'plasmid', 'replicon', 'incfib', 'incf', 'inci1', 'inci', 'col',
  'conjugative', 'transposon', 'integron', 'insertion sequence',
  // Virulence genes
  'virulence', 'eae', 'hlya', 'iuca', 'iron', 'stx', 'stx1', 'stx2',
  'espb', 'tir', 'siderophore', 'toxin', 'fimbriae', 'adhesin',
  // Alignment / sequence metrics
  'pct_coverage', 'pct_identity', 'coverage', 'identity', 'alignment',
  'alignment_length', 'ref_seq', 'accession', 'sequence name',
  // Water quality / environmental parameters
  'ph', 'temperature', 'temp_water', 'tds', 'dissolved oxygen',
  'dissolved_oxygen', 'conductivity', 'turbidity', 'water quality',
  'environmental', 'wastewater', 'effluent',
];

export class ChatbotService {
  private readonly client: BedrockRuntimeClient;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
  }

  async ask(question: string): Promise<string> {
    this.assertRelevant(question);
    return this.callBedrock(question);
  }

  private assertRelevant(question: string): void {
    const lower = question.toLowerCase();
    const isRelevant = TOPIC_KEYWORDS.some((kw) => lower.includes(kw));
    if (!isRelevant) {
      throw new ValidationError([
        'Your question does not appear to be related to the AMR Surveillance Dashboard. Please ask about dashboard features or AMR concepts.',
      ]);
    }
  }

  private async callBedrock(question: string): Promise<string> {
    const command = new ConverseCommand({
      modelId: MODEL_ID,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: 'user',
          content: [{ text: question }],
        },
      ],
      inferenceConfig: {
        maxTokens: 120,
        temperature: 0.2,
      },
    });

    const response = await this.client.send(command);

    const output = response.output?.message?.content?.[0];
    if (!output || !('text' in output) || typeof output.text !== 'string') {
      throw new AppError('Received an empty or unexpected response from the AI model.', 502);
    }

    return output.text.trim();
  }
}
