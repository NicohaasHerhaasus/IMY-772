import React, { useState } from 'react';
import './SiteVisitTimeline.css';

const riskColor: Record<string,string> = {
  high: '#d62728',
  medium: '#ff7f0e',
  low: '#2ca02c',
  none: '#6c757d',
};

export default function SiteVisitTimeline({ visits }: { visits: any[] }) {
  const [selected, setSelected] = useState<number | null>(visits.length ? 0 : null);

  if (!visits || visits.length === 0) return <div className="svt-empty">No site visits</div>;

  return (
    <div className="svt-root">
      <div className="svt-line">
        {visits.map((v, i) => (
          <button
            key={i}
            className={`svt-dot ${selected === i ? 'selected' : ''}`}
            onClick={() => setSelected(i)}
            title={v.visitDate ?? 'unknown'}
          >
            <span className="svt-dot-inner" style={{ background: riskColor[v.visitRisk] ?? riskColor.none }} />
            <div className="svt-date">{v.visitDate ?? 'unknown'}</div>
          </button>
        ))}
      </div>

      <div className="svt-detail">
        {selected != null && visits[selected] ? (
          <div>
            <div className="svt-detail-title">Visit: {visits[selected].visitDate ?? 'unknown'}</div>
            <div>Risk: <strong style={{ color: riskColor[visits[selected].visitRisk] }}>{visits[selected].visitRisk}</strong></div>
            <div>Samples: {visits[selected].sampleCount}</div>
            <ul className="svt-sample-list">
              {visits[selected].samples.map((s: any) => (
                <li key={s.id || s.sampleName}>{s.sampleName} — genes: {(s.amrGenes || []).join(', ')}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div>Select a visit</div>
        )}
      </div>
    </div>
  );
}
