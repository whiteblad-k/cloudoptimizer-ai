import React, { useState } from "react";
import { Check, Copy, ArrowRight, ShieldCheck, Mail, Image as ImageIcon, HardDrive, Trash2, Zap } from "lucide-react";
import { RecommendationItem } from "../types";

interface TacticalRecommendationsProps {
  recommendations: RecommendationItem[];
  onExecuteRecommendation: (rec: RecommendationItem) => void;
  onSelectTab: (tab: "EMAILS" | "PHOTOS" | "DRIVE_FILES" | "TRASH") => void;
}

export const TacticalRecommendations: React.FC<TacticalRecommendationsProps> = ({
  recommendations,
  onExecuteRecommendation,
  onSelectTab,
}) => {
  const [copiedQueryId, setCopiedQueryId] = useState<string | null>(null);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "GMAIL":
        return <Mail className="w-4 h-4 text-indigo-400" />;
      case "PHOTOS":
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case "DRIVE":
        return <HardDrive className="w-4 h-4 text-amber-400" />;
      default:
        return <Trash2 className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleCopySearchQuery = (rec: RecommendationItem) => {
    navigator.clipboard.writeText(rec.searchQuery);
    setCopiedQueryId(rec.id);
    setTimeout(() => setCopiedQueryId(null), 2000);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            <h3 className="text-white font-bold text-lg tracking-tight">
              Acciones Tácticas
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Sugerencias de alta eficacia para liberar almacenamiento
          </p>
        </div>

        <span className="px-2.5 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-black rounded uppercase tracking-wider">
          Alto Impacto
        </span>
      </div>

      <div className="space-y-4 overflow-y-auto pr-1">
        {recommendations.length === 0 ? (
          <div className="py-8 text-center space-y-2 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">¡Almacenamiento Optimizado!</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay vectores críticos de saturación detectados en este momento.
            </p>
          </div>
        ) : (
          recommendations.map((rec, index) => (
            <div
              key={rec.id}
              className="group bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 p-5 rounded-2xl transition-all space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="text-indigo-400 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                  {getCategoryIcon(rec.category)}
                  <span>Recomendación 0{index + 1}</span>
                </span>
                <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  +{rec.gbSavings} GB
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{rec.title}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{rec.description}</p>
              </div>

              {/* Search Operator Syntax Helper */}
              {rec.searchQuery && (
                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Filtro:
                    </span>
                    <code className="font-mono text-cyan-300 text-[11px] truncate select-all">
                      {rec.searchQuery}
                    </code>
                  </div>

                  <button
                    onClick={() => handleCopySearchQuery(rec)}
                    className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors ml-2 flex-shrink-0"
                    title="Copiar operador de búsqueda"
                  >
                    {copiedQueryId === rec.id ? (
                      <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Copiado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1">
                        <Copy className="w-3 h-3" /> Copiar
                      </span>
                    )}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onExecuteRecommendation(rec)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>EJECUTAR LIMPIEZA</span>
                </button>

                <button
                  onClick={() => onSelectTab(rec.actionableType)}
                  className="px-3 py-2 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                >
                  <span>Revisar</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Engine Ver: 4.8.2-diag</span>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <div className="w-2 h-2 rounded-full bg-slate-700" />
        </div>
      </div>
    </div>
  );
};

