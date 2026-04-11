import { useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer,
  PieChart, Pie, Legend,
} from "recharts";
import "./DataAnalyticsCard.css";

// ── Types ──────────────────────────────────────────────
type TabType = "genes" | "classes" | "plasmids";

// ── Data ──────────────────────────────────────────────
const GENES_DATA = [
  { name: "β-L",  count: 12, fill: "#7b6cf6" },
  { name: "Tet",  count: 8,  fill: "#7b6cf6" },
  { name: "Amg",  count: 6,  fill: "#7b6cf6" },
  { name: "Mac",  count: 3,  fill: "#7b6cf6" },
];

// Two series for the grouped horizontal bar chart
// We render them as two overlapping bars per row
const GENES_DATA_FULL = [
  { name: "β-L",  purple: 12, amber: 9  },
  { name: "Tet",  purple: 8,  amber: 6  },
  { name: "Amg",  purple: 6,  amber: 4  },
  { name: "Mac",  purple: 3,  amber: 2  },
];

const CLASS_DATA = [
  { name: "Beta-lactam",    value: 42, fill: "#3eb99a" },
  { name: "Aminoglycoside", value: 25, fill: "#7b6cf6" },
  { name: "Tetracycline",   value: 18, fill: "#f0a040" },
  { name: "Other",          value: 15, fill: "#e04040" },
];

const VISIT_DATA = [
  { visit: "V1", rate: 28, fill: "#4caf82" },
  { visit: "V2", rate: 38, fill: "#6dc472" },
  { visit: "V3", rate: 54, fill: "#c4b44a" },
  { visit: "V4", rate: 64, fill: "#d4a84a" },
  { visit: "V5", rate: 74, fill: "#c47a70" },
  { visit: "V6", rate: 82, fill: "#c46060" },
  { visit: "V7", rate: 95, fill: "#d45050" },
];

// ── Custom tooltip styles ──────────────────────────────
const tooltipStyle = {
  background: "#0f1f2e",
  border: "1px solid #2a3f54",
  borderRadius: 8,
  color: "#e8edf2",
  fontSize: 11,
  padding: "6px 10px",
};

// ── Subcomponents ─────────────────────────────────────

function GenesChart() {
  return (
    <div className="dac-chart-wrap">
      <div className="dac-chart-title">Genes by antibiotic class</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={GENES_DATA_FULL}
          layout="vertical"
          margin={{ top: 4, right: 12, bottom: 4, left: 28 }}
          barCategoryGap="28%"
          barGap={2}
        >
          <XAxis
            type="number"
            tick={{ fill: "#4a6880", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 14]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#8aa0b4", fontSize: 11, fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(val: any) => [val, "Count"]}
          />
          <Bar dataKey="purple" fill="#7b6cf6" radius={[0, 3, 3, 0]} maxBarSize={10} />
          <Bar dataKey="amber"  fill="#f0a040" radius={[0, 3, 3, 0]} maxBarSize={10} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ClassesChart() {
  const renderLabel = useCallback(
    ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
      const RADIAN = Math.PI / 180;
      const r = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + r * Math.cos(-midAngle * RADIAN);
      const y = cy + r * Math.sin(-midAngle * RADIAN);
      if (percent < 0.1) return null;
      return (
        <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
          fontSize={10} fontWeight={600}>
          {`${Math.round(percent * 100)}%`}
        </text>
      );
    },
    []
  );

    return (
    <div className="dac-chart-wrap">
      <div className="dac-chart-title">AMR class distribution</div>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={CLASS_DATA}
            cx="50%"
            cy="50%"
            outerRadius={72}
            dataKey="value"
            labelLine={false}
            label={renderLabel}
            strokeWidth={2}
            stroke="#1c2f42"
          >
            {CLASS_DATA.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            iconSize={7}
            wrapperStyle={{ fontSize: 9, color: "#8aa0b4", paddingTop: 4 }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val: any) => [`${val}%`, "Distribution"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function PlasidsChart() {
  return (
    <div className="dac-chart-wrap">
      <div className="dac-chart-title">Resistance rate per visit</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={VISIT_DATA}
          margin={{ top: 4, right: 8, bottom: 4, left: -8 }}
          barCategoryGap="20%"
        >
          <XAxis
            dataKey="visit"
            tick={{ fill: "#8aa0b4", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#4a6880", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            formatter={(val: any) => [`${val}%`, "Rate"]}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {VISIT_DATA.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export default function DataAnalyticsCard() {
  const [activeTab, setActiveTab] = useState<TabType>("genes");

  const tabs: { key: TabType; label: string }[] = [
    { key: "genes",    label: "Resistance Genes" },
    { key: "classes",  label: "AMR Classes"      },
    { key: "plasmids", label: "Plasmid Types"    },
  ];

  return (
    <div className="dac-card">
      <div className="dac-title">Data Analysis</div>

      <div className="dac-chart-area">
        {activeTab === "genes"   && <GenesChart />}
        {activeTab === "classes" && <ClassesChart />}
        {activeTab === "plasmids"&& <PlasidsChart />}
      </div>

      <div className="dac-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`dac-tab ${activeTab === tab.key ? "dac-tab--active" : "dac-tab--inactive"}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dac-group-label">Group data by ↓</div>
    </div>
  );
}