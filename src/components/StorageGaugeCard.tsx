import React from "react";
import { HardDrive, ArrowDownCircle, DollarSign, Sparkles, AlertTriangle, Activity, Mail, Image as ImageIcon, FileText, Trash2 } from "lucide-react";
import { StorageMetrics, SaturationVectors } from "../types";

interface StorageGaugeCardProps {
  metrics: StorageMetrics;
  vectors: SaturationVectors;
  onQuickPurgeAll: () => void;
}

export const StorageGaugeCard: React.FC<StorageGaugeCardProps> = ({
  metrics,
  vectors,
  onQuickPurgeAll,
}) => {
  const getProgressGradient = () => {
    if (metrics.usedPercentage >= 90)
      return "bg-gradient-to-r from-indigo-500 via-rose-500 to-red-600 shadow-[0_0_20px_rgba(225,29,72,0.4)]";
    if (metrics.usedPercentage >= 75)
      return "bg-gradient-to-r from-indigo-500 via-amber-500 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
    return "bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
  };

  const gmailGb = Number((metrics.usedGb * 0.15).toFixed(1));
  const photosGb = Number((metrics.usedGb * 0.45).toFixed(1));
  const driveGb = Number((metrics.usedGb * 0.32).toFixed(1));
  const trashGb = Number((metrics.usedGb * 0.08).toFixed(1));

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-8">
      {/* Background radial glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: System Saturation Meter */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-400 text-xs sm:text-sm font-medium uppercase tracking-[0.2em]">
              Saturación del Sistema
            </h2>
            <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {metrics.status === "CRITICAL"
                ? "Nivel Crítico"
                : metrics.status === "WARNING"
                ? "Nivel Alto"
                : "Nivel Normal"}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-6xl sm:text-7xl font-black text-white leading-none tracking-tight">
              {metrics.usedPercentage}
              <span className="text-2xl sm:text-3xl text-slate-500 font-medium ml-1">%</span>
            </h1>
            <div className="text-xs sm:text-sm font-bold text-slate-400">
              {metrics.usedGb.toFixed(1)} GB / {metrics.totalGb.toFixed(1)} GB
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden relative p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${getProgressGradient()}`}
                style={{ width: `${Math.min(100, metrics.usedPercentage)}%` }}
              />
              {metrics.totalPotentialFreedGb > 0 && (
                <div
                  className="absolute top-0 bottom-0 border-l-2 border-dashed border-cyan-400 z-10"
                  style={{ width: `${Math.max(0, metrics.projectedPercentage)}%` }}
                  title={`Nivel proyectado tras liberación: ${metrics.projectedPercentage}%`}
                />
              )}
            </div>

            <div className="flex justify-between text-xs font-mono text-slate-500">
              <span>{metrics.usedGb.toFixed(1)} GB OCUPADO</span>
              {metrics.totalPotentialFreedGb > 0 && (
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <ArrowDownCircle className="w-3.5 h-3.5" /> Proyectado post-purga: {metrics.projectedUsedGbAfterCleanup} GB ({metrics.projectedPercentage}%)
                </span>
              )}
              <span>{metrics.totalGb.toFixed(1)} GB CAPACIDAD TOTAL</span>
            </div>
          </div>
        </div>

        {/* Right Side: Reclaimed Impact Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-slate-900/90 border border-indigo-500/30 rounded-2xl p-6 flex flex-col justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" /> Espacio Liberable Inmediato
              </span>
              {metrics.annualSavingsUsd > 0 && (
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-full font-mono">
                  +${metrics.annualSavingsUsd.toFixed(2)}/año ahorrados
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white tracking-tight">
                {metrics.totalPotentialFreedGb} <span className="text-2xl text-slate-400 font-normal">GB</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Purga táctica recomendada por la IA para evitar pagar suscripciones innecesarias de almacenamiento.
            </p>
          </div>

          <button
            onClick={onQuickPurgeAll}
            className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            <Activity className="w-4 h-4" />
            <span>Ejecutar Limpieza Completa</span>
          </button>
        </div>
      </div>

      {/* 4 Vector Service Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 flex-shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Gmail</p>
            <p className="text-xl font-bold text-white">{gmailGb} GB</p>
            <p className="text-[10px] text-indigo-400 mt-0.5 font-mono">~{vectors.heavyEmailsGb} GB liberables</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 flex-shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Photos</p>
            <p className="text-xl font-bold text-white">{photosGb} GB</p>
            <p className="text-[10px] text-cyan-400 mt-0.5 font-mono">~{vectors.duplicatePhotosGb} GB liberables</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Drive</p>
            <p className="text-xl font-bold text-white">{driveGb} GB</p>
            <p className="text-[10px] text-amber-400 mt-0.5 font-mono">~{vectors.oldDriveFilesGb} GB liberables</p>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-3xl flex items-center gap-4 hover:border-slate-700 transition-colors">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase">Papelera</p>
            <p className="text-xl font-bold text-white">{trashGb} GB</p>
            <p className="text-[10px] text-emerald-400 mt-0.5 font-mono">~{vectors.trashCacheGb} GB liberables</p>
          </div>
        </div>
      </div>
    </div>
  );
};

