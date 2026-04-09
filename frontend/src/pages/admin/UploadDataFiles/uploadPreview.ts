import * as XLSX from "xlsx";

export const MAX_PREVIEW_ROWS = 30;

const GENOTYPIC_SPREADSHEET_HEADERS = [
  "University of Pretoria Culture number",
  "Isolate number",
  "Farm",
  "Trip",
  "Source",
  "Sample Number",
  "AR Code",
  "Isolate number",
  "Notes",
  "Organism Identity",
  "Owner",
  "IntI1 Positive",
  "IntI2 Positive",
  "IntI3 Positive",
  "CTX-M Gp1",
  "CTX-M Gp9",
  "CTX-M Gp8/25",
  "TEM",
  "SHV",
  "OXA",
  "ACC",
  "EBC",
  "DHA",
  "CIT",
  "FOX",
  "MOX",
] as const;

export type GenotypicUploadRow = {
  upCultureNumber: string;
  isolateNumber: string;
  farm: string;
  trip: string;
  source: string;
  sampleNumber: string;
  arCode: string;
  isolateNumberSecondary: string;
  notes: string;
  organismIdentity: string;
  owner: string;
  intI1Positive: string;
  intI2Positive: string;
  intI3Positive: string;
  ctxMGp1: string;
  ctxMGp9: string;
  ctxMGp825: string;
  tem: string;
  shv: string;
  oxa: string;
  acc: string;
  ebc: string;
  dha: string;
  cit: string;
  fox: string;
  mox: string;
};

/** Column order for preview tables (matches upload payload). */
export const GENOTYPIC_PREVIEW_COLUMNS: { key: keyof GenotypicUploadRow; label: string }[] = [
  { key: "upCultureNumber", label: "UP culture #" },
  { key: "isolateNumber", label: "Isolate #" },
  { key: "farm", label: "Farm" },
  { key: "trip", label: "Trip" },
  { key: "source", label: "Source" },
  { key: "sampleNumber", label: "Sample #" },
  { key: "arCode", label: "AR code" },
  { key: "isolateNumberSecondary", label: "Isolate # (2)" },
  { key: "notes", label: "Notes" },
  { key: "organismIdentity", label: "Organism" },
  { key: "owner", label: "Owner" },
  { key: "intI1Positive", label: "IntI1" },
  { key: "intI2Positive", label: "IntI2" },
  { key: "intI3Positive", label: "IntI3" },
  { key: "ctxMGp1", label: "CTX-M Gp1" },
  { key: "ctxMGp9", label: "CTX-M Gp9" },
  { key: "ctxMGp825", label: "CTX-M Gp8/25" },
  { key: "tem", label: "TEM" },
  { key: "shv", label: "SHV" },
  { key: "oxa", label: "OXA" },
  { key: "acc", label: "ACC" },
  { key: "ebc", label: "EBC" },
  { key: "dha", label: "DHA" },
  { key: "cit", label: "CIT" },
  { key: "fox", label: "FOX" },
  { key: "mox", label: "MOX" },
];

function normalizeExcelHeaderCell(value: unknown): string {
  return String(value ?? "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const EXPECTED_HEADER_NORMALIZED = GENOTYPIC_SPREADSHEET_HEADERS.map((h) =>
  normalizeExcelHeaderCell(h),
);

function matrixRowToUploadRow(row: unknown[]): GenotypicUploadRow {
  const c = (i: number): string => String(row[i] ?? "").trim();
  return {
    upCultureNumber: c(0),
    isolateNumber: c(1),
    farm: c(2),
    trip: c(3),
    source: c(4),
    sampleNumber: c(5),
    arCode: c(6),
    isolateNumberSecondary: c(7),
    notes: c(8),
    organismIdentity: c(9),
    owner: c(10),
    intI1Positive: c(11),
    intI2Positive: c(12),
    intI3Positive: c(13),
    ctxMGp1: c(14),
    ctxMGp9: c(15),
    ctxMGp825: c(16),
    tem: c(17),
    shv: c(18),
    oxa: c(19),
    acc: c(20),
    ebc: c(21),
    dha: c(22),
    cit: c(23),
    fox: c(24),
    mox: c(25),
  };
}

export function parseGenotypicXlsxForPreview(buffer: ArrayBuffer): {
  rows: GenotypicUploadRow[];
  sheetName: string;
} {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error("File is empty.");
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    throw new Error("Invalid .xlsx file.");
  }

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
      header: 1,
      defval: "",
      raw: false,
    }) as unknown[][];

    if (!matrix.length) continue;

    const maxScan = Math.min(15, matrix.length);
    for (let headerRowIndex = 0; headerRowIndex < maxScan; headerRowIndex += 1) {
      const headerCells = (matrix[headerRowIndex] ?? []).map((cell) => String(cell ?? "").trim());
      if (headerCells.length < EXPECTED_HEADER_NORMALIZED.length) continue;

      const normalizedHeaderRow = headerCells
        .slice(0, EXPECTED_HEADER_NORMALIZED.length)
        .map((h) => normalizeExcelHeaderCell(h));

      let headerMatch = true;
      for (let i = 0; i < EXPECTED_HEADER_NORMALIZED.length; i += 1) {
        if (normalizedHeaderRow[i] !== EXPECTED_HEADER_NORMALIZED[i]) {
          headerMatch = false;
          break;
        }
      }
      if (!headerMatch) continue;

      const rows: GenotypicUploadRow[] = [];
      for (let r = headerRowIndex + 1; r < matrix.length; r += 1) {
        const rawRow = matrix[r] ?? [];
        const row = rawRow as unknown[];
        const hasValue = row.some((cell) => String(cell ?? "").trim() !== "");
        if (!hasValue) continue;
        rows.push(matrixRowToUploadRow(row));
      }

      if (rows.length === 0) {
        throw new Error("No data rows found below the header row on the matching sheet.");
      }

      return { rows, sheetName };
    }
  }

  throw new Error(
    `No sheet with required genotypic headers. Sheets: ${workbook.SheetNames.join(", ") || "(none)"}`,
  );
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function sheetNameKey(name: string): string {
  return normalizeHeader(name);
}

function findWorksheet(
  workbook: XLSX.WorkBook,
  ...canonicalNames: string[]
): { sheet: XLSX.WorkSheet; name: string } | undefined {
  const wanted = new Set(canonicalNames.map((n) => sheetNameKey(n)));
  for (const sheetName of workbook.SheetNames) {
    if (wanted.has(sheetNameKey(sheetName))) {
      const sheet = workbook.Sheets[sheetName];
      if (sheet) return { sheet, name: sheetName };
    }
  }
  return undefined;
}

export type StarAmrPreviewTable = {
  tabTitle: string;
  headers: string[];
  rows: string[][];
};

export type StarAmrPreview = {
  sheetNames: string[];
  summary: StarAmrPreviewTable | null;
  detailed: StarAmrPreviewTable | null;
  warning: string | null;
};

function sheetToStringMatrix(sheet: XLSX.WorkSheet, maxRows: number): { headers: string[]; rows: string[][] } {
  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (!matrix.length) {
    return { headers: [], rows: [] };
  }

  const headerRow = matrix[0] ?? [];
  const headers = headerRow.map((c) => String(c ?? "").trim());
  const dataRows: string[][] = [];
  for (let i = 1; i < matrix.length && dataRows.length < maxRows; i += 1) {
    const row = matrix[i] ?? [];
    const strRow = headers.map((_, j) => String(row[j] ?? "").trim());
    if (strRow.every((c) => c === "")) continue;
    dataRows.push(strRow);
  }
  return { headers, rows: dataRows };
}

export function parseStarAmrXlsxForPreview(buffer: ArrayBuffer): StarAmrPreview {
  if (!buffer || buffer.byteLength === 0) {
    return {
      sheetNames: [],
      summary: null,
      detailed: null,
      warning: "File is empty.",
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      sheetNames: [],
      summary: null,
      detailed: null,
      warning: "Invalid .xlsx file.",
    };
  }

  const sheetNames = workbook.SheetNames;
  const summaryMatch = findWorksheet(workbook, "Summary");
  const detailedMatch = findWorksheet(workbook, "Detailed_Summary", "Detailed Summary");

  let warning: string | null = null;
  if (!summaryMatch || !detailedMatch) {
    warning =
      "StarAMR expects Summary and Detailed_Summary sheets. Preview below may be incomplete. " +
      `Sheets in file: ${sheetNames.join(", ") || "(none)"}`;
  }

  const summary = summaryMatch
    ? (() => {
        const { headers, rows } = sheetToStringMatrix(summaryMatch.sheet, MAX_PREVIEW_ROWS);
        return { tabTitle: summaryMatch.name, headers, rows };
      })()
    : null;

  const detailed = detailedMatch
    ? (() => {
        const { headers, rows } = sheetToStringMatrix(detailedMatch.sheet, MAX_PREVIEW_ROWS);
        return { tabTitle: detailedMatch.name, headers, rows };
      })()
    : null;

  return { sheetNames, summary, detailed, warning };
}
