// // src/context/IsolatesContext.tsx
// // Fetches GET /api/isolates ONCE on app load.
// // All pages (AMR Profiles, Map View, River Flows) read from this context
// // so we never make duplicate network requests.

// import {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   type ReactNode,
// } from 'react';
// import { apiFetch } from '../lib/api/apiClient';
// import type { IsolateRow, ApiResponse } from '../lib/api/types';

// // ── Context shape ──────────────────────────────────────
// interface IsolatesContextValue {
//   isolates: IsolateRow[];
//   loading:  boolean;
//   error:    string | null;
//   refetch:  () => void;
// }

// const IsolatesContext = createContext<IsolatesContextValue>({
//   isolates: [],
//   loading:  true,
//   error:    null,
//   refetch:  () => {},
// });

// // ── Provider ───────────────────────────────────────────
// export function IsolatesProvider({ children }: { children: ReactNode }) {
//   const [isolates, setIsolates] = useState<IsolateRow[]>([]);
//   const [loading,  setLoading]  = useState(true);
//   const [error,    setError]    = useState<string | null>(null);
//   const [tick,     setTick]     = useState(0);

//   useEffect(() => {
//     let cancelled = false;
//     setLoading(true);
//     setError(null);

//     apiFetch<ApiResponse<IsolateRow[]>>('/api/isolates')
//       .then(res => {
//         if (cancelled) return;
//         // Handle both { data: [...] } and plain array responses
//         const rows = Array.isArray(res) ? res : res.data ?? [];
//         setIsolates(rows);
//       })
//       .catch(err => {
//         if (cancelled) return;
//         setError(err instanceof Error ? err.message : 'Failed to load isolates');
//       })
//       .finally(() => {
//         if (!cancelled) setLoading(false);
//       });

//     return () => { cancelled = true; };
//   }, [tick]);

//   const refetch = () => setTick(t => t + 1);

//   return (
//     <IsolatesContext.Provider value={{ isolates, loading, error, refetch }}>
//       {children}
//     </IsolatesContext.Provider>
//   );
// }

// // ── Hook ───────────────────────────────────────────────
// export function useIsolates() {
//   return useContext(IsolatesContext);
// }


// src/context/IsolatesContext.tsx
// Fetches GET /api/isolates once on app load.
// Response shape: { status: 'success', data: IsolateRow[] }
// Each IsolateRow has camelCase keys and nested genotypes/phenotypes/plasmids arrays.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch } from '../lib/api/apiClient';
import type { IsolateRow } from '../lib/api/types';

interface IsolatesContextValue {
  isolates: IsolateRow[];
  loading:  boolean;
  error:    string | null;
  refetch:  () => void;
}

const IsolatesContext = createContext<IsolatesContextValue>({
  isolates: [], loading: true, error: null, refetch: () => {},
});

export function IsolatesProvider({ children }: { children: ReactNode }) {
  const [isolates, setIsolates] = useState<IsolateRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tick,     setTick]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<{ status: string; data: IsolateRow[] }>('/api/isolates')
      .then(res => {
        if (cancelled) return;
        // Controller wraps in { status: 'success', data: [...] }
        const rows: IsolateRow[] = Array.isArray(res) ? res : (res.data ?? []);
        setIsolates(rows);
      })
      .catch(err => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load isolates');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [tick]);

  return (
    <IsolatesContext.Provider value={{ isolates, loading, error, refetch: () => setTick(t => t + 1) }}>
      {children}
    </IsolatesContext.Provider>
  );
}

export function useIsolates() {
  return useContext(IsolatesContext);
}