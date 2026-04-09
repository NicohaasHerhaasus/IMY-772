import { useEffect, useMemo, useState } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Box, Chip, Stack } from "@mui/material";
import Modal from "../ui/Modal";
import { Button, Card } from "../ui";
import "./IsolateExplorer.css";

const API_BASE_URL = "http://localhost:3000";

type IsolateExplorerItem = {
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

function formatPercent(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}%`;
}

interface IsolateExplorerProps {
  refreshSignal?: number;
  showTitle?: boolean;
}

export default function IsolateExplorer({ refreshSignal = 0, showTitle = true }: IsolateExplorerProps) {
  const [rows, setRows] = useState<IsolateExplorerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selected, setSelected] = useState<IsolateExplorerItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/isolates`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.message || "Failed to load isolates.");
        }

        const items = (result?.data ?? []) as IsolateExplorerItem[];
        if (!cancelled) {
          setRows(items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load isolates.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  const columns = useMemo<GridColDef<IsolateExplorerItem>[]>(
    () => [
      { field: "isolateName", headerName: "Isolate Name", flex: 1, minWidth: 180 },
      { field: "qualityModule", headerName: "Quality", width: 120 },
      {
        field: "sequenceType",
        headerName: "Sequence Type",
        flex: 1,
        minWidth: 160,
        valueGetter: (_v, row) => row.sequenceType ?? "—",
      },
      {
        field: "totalGenes",
        headerName: "Total Genes",
        width: 120,
        sortable: true,
        valueGetter: (_v, row) => row.genotypes?.length ?? 0,
      },
      {
        field: "resistantAntibiotics",
        headerName: "Resistant Antibiotics",
        flex: 2,
        minWidth: 260,
        sortable: false,
        renderCell: (params) => {
          const antibiotics = (params.row.phenotypes ?? [])
            .map((p) => p.antibioticName)
            .filter(Boolean);

          if (antibiotics.length === 0) return <span>—</span>;

          return (
            <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
              {antibiotics.slice(0, 6).map((name, idx) => (
                <Chip key={`${params.row.id}-${idx}`} label={name} size="small" />
              ))}
              {antibiotics.length > 6 && (
                <Chip label={`+${antibiotics.length - 6}`} size="small" variant="outlined" />
              )}
            </Stack>
          );
        },
      },
      {
        field: "actions",
        headerName: "Details",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <button
            className="text-primary font-semibold hover:underline"
            onClick={() => setSelected(params.row)}
          >
            View
          </button>
        ),
      },
    ],
    [],
  );

  return (
    <div className="isolate-explorer">
      {showTitle && (
        <h1 className="isolate-explorer__title">Isolate Explorer</h1>
      )}

      <Card className="isolate-explorer__card">
        {error && <p className="isolate-explorer__error">{error}</p>}

        <Box sx={{ height: 620, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.id}
            disableRowSelectionOnClick
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 25 } },
            }}
            pageSizeOptions={[10, 25, 50, 100]}
            sx={{
              border: "1px solid rgba(0, 0, 0, 0.08)",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              "& .MuiDataGrid-columnHeaders": {
                fontWeight: 700,
                backgroundColor: "rgba(13, 61, 61, 0.04)",
                color: "var(--color-primary)",
              },
              "& .MuiDataGrid-cell": {
                outline: "none",
                borderColor: "rgba(0, 0, 0, 0.05)",
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "rgba(26, 158, 122, 0.06)",
              },
            }}
            showToolbar
          />
        </Box>
      </Card>

      {selected && (
        <Modal
          title={`Isolate Details: ${selected.isolateName}`}
          onClose={() => setSelected(null)}
          footer={
            <Button onClick={() => setSelected(null)} variant="secondary">
              Close
            </Button>
          }
        >
          <div className="isolate-explorer__details">
            <div className="isolate-explorer__meta-grid">
              <div className="isolate-explorer__meta-item">
                <span className="isolate-explorer__meta-label">Quality</span>
                <div className="isolate-explorer__meta-value">{selected.qualityModule}</div>
              </div>
              <div className="isolate-explorer__meta-item">
                <span className="isolate-explorer__meta-label">Sequence Type</span>
                <div className="isolate-explorer__meta-value">{selected.sequenceType ?? "—"}</div>
              </div>
              <div className="isolate-explorer__meta-item">
                <span className="isolate-explorer__meta-label">Genome Length</span>
                <div className="isolate-explorer__meta-value">
                  {selected.genomeLength?.toLocaleString() ?? "—"}
                </div>
              </div>
              <div className="isolate-explorer__meta-item">
                <span className="isolate-explorer__meta-label">N50</span>
                <div className="isolate-explorer__meta-value">
                  {selected.n50Value?.toLocaleString() ?? "—"}
                </div>
              </div>
            </div>

            <div className="isolate-explorer__table-block">
              <h3 className="isolate-explorer__section-title">Genotypes</h3>
              <div className="isolate-explorer__table-wrap">
                <table className="isolate-explorer__table">
                  <thead>
                    <tr>
                      <th>Gene Name</th>
                      <th>Identity %</th>
                      <th>Accession</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.genotypes ?? []).length === 0 ? (
                      <tr>
                        <td className="isolate-explorer__empty-cell" colSpan={3}>
                          No genotypes.
                        </td>
                      </tr>
                    ) : (
                      selected.genotypes.map((g) => (
                        <tr key={g.id}>
                          <td>{g.geneName}</td>
                          <td>{formatPercent(g.identityPercentage)}</td>
                          <td>{g.accessionId ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="isolate-explorer__table-block">
              <h3 className="isolate-explorer__section-title">Plasmids</h3>
              <div className="isolate-explorer__table-wrap">
                <table className="isolate-explorer__table">
                  <thead>
                    <tr>
                      <th>Plasmid Name</th>
                      <th>Identity %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.plasmids ?? []).length === 0 ? (
                      <tr>
                        <td className="isolate-explorer__empty-cell" colSpan={2}>
                          No plasmids.
                        </td>
                      </tr>
                    ) : (
                      selected.plasmids.map((p) => (
                        <tr key={p.id}>
                          <td>{p.plasmidName}</td>
                          <td>{formatPercent(p.identityPercentage)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

