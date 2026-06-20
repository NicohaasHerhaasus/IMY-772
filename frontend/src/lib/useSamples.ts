import { useCallback, useEffect, useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export interface Sample {
  id: string;
  sampleName: string;
  analysisType: string | null;
  isolateId: string | null;
  organism: string | null;
  sampleId: string | null;
  isolationSource: string;
  collectionDate: string;
  geoLocName: string;
  region: string;
  latitude: number;
  longitude: number;
  collectedBy: string | null;
  amrGenes: string[];
  sequenceName: string | null;
  elementType: string | null;
  amrClass: string | null;
  subclass: string | null;
  pctCoverage: number | null;
  pctIdentity: number | null;
  alignmentLength: number | null;
  refSeqLength: number | null;
  accession: string | null;
  virulenceGenes: string[];
  plasmidReplicons: string[];
  predictedSir: string[];
  ph: number | null;
  tempWaterC: number | null;
  tdsMgL: number | null;
  dissolvedOxygenMgL: number | null;
}

interface ApiResponse {
  status: 'success' | 'error';
  data: { samples: Sample[]; count: number };
}

export function useSamples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSamples = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let accessToken: string | undefined;
      try {
        const { tokens } = await fetchAuthSession();
        accessToken = tokens?.accessToken?.toString();
      } catch (sessionErr) {
        // public access ok
        console.log('[useSamples] No auth session (public access)', sessionErr);
      }

      let res: Response;
      try {
        const headers: Record<string, string> = {};
        if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
        res = await fetch('/api/samples', { headers });
      } catch (networkErr) {
        throw new Error(`Network error — is the API server running? (${String(networkErr)})`);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '(no body)');
        throw new Error(`API returned ${res.status} ${res.statusText}: ${text}`);
      }

      const rawText = await res.text();
      let json: ApiResponse;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`API response was not valid JSON (status ${res.status}). Body: ${rawText.slice(0,200)}`);
      }

      setSamples(json.data.samples);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSamples(); }, [fetchSamples]);

  return { samples, loading, error, refetch: fetchSamples } as const;
}
