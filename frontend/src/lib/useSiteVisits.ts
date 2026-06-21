import { useEffect, useState } from 'react';

type SiteVisit = {
  visitDate: string | null;
  visitRisk: 'high' | 'medium' | 'low' | 'none';
  sampleCount: number;
  samples: Array<any>;
};

export function useSiteVisits(isolateId?: string | null) {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isolateId) {
      setVisits([]);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/site-visits?isolateId=${encodeURIComponent(isolateId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setVisits(json.data.visits ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isolateId]);

  return { visits, loading, error };
}

export type { SiteVisit };
