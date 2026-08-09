import React, { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { PieChart as PieIcon, BarChart3, Info } from "lucide-react";
import { SaturationVectors, StorageMetrics } from "../types";

interface BreakdownChartProps {
  metrics: StorageMetrics;
  vectors: SaturationVectors;
}

export const BreakdownChart: React.FC<BreakdownChartProps> = ({ metrics, vectors }) => {
  const [chartType, setChartType] = useState<"pie" | "bar">("pie");

  // Approximate category distribution
  const data = [
    { name: "Google Photos", value: Number((metrics.usedGb * 0.45).toFixed(2)), color: "#06b6d4", savings: vectors.duplicatePhotosGb },
    { name: "Google Drive", value: Number((metrics.usedGb * 0.32).toFixed(2)), color: "#8b5cf6", savings: vectors.oldDriveFilesGb },
    { name: "Gmail", value: Number((metrics.usedGb * 0.15).toFixed(2)), color: "#6366f1", savings: vectors.heavyEmailsGb },
    { name: "Papelera", value: Number((metrics.usedGb * 0.08).toFixed(2)), color: "#10b981", savings: vectors.trashCacheGb },
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-lg tracking-tight">
            Distribución de Vectores
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Desglose de uso por servicio de Google</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setChartType("pie")}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              chartType === "pie" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Vista Circular"
          >
            <PieIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
              chartType === "bar" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
            title="Vista de Barras"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-60 w-full relative my-auto">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "pie" ? (
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-950/90 border border-slate-800 p-3 rounded-xl text-xs shadow-2xl space-y-1 backdrop-blur-md">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-slate-300">Ocupado: <strong className="text-indigo-400">{item.value} GB</strong></p>
                        <p className="text-emerald-400">Liberable: <strong>~{item.savings} GB</strong></p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={0} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-xs shadow-2xl">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-slate-300">{item.value} GB</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800 text-xs font-mono">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 bg-slate-900/30 p-2 rounded-xl border border-slate-800/50">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-slate-300 truncate text-[11px] font-medium">{item.name}</span>
            <span className="text-indigo-400 text-[11px] font-bold ml-auto">{item.value}GB</span>
          </div>
        ))}
      </div>
    </div>
  );
};

