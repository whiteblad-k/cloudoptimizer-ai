import React from "react";
import { Cpu, HardDrive, RefreshCw, Zap, Settings, Crown, LogOut, ShieldCheck, User } from "lucide-react";
import { PRESET_PROFILES } from "../data/mockData";
import { StorageMetrics, UserProfile } from "../types";

interface HeaderProps {
  metrics: StorageMetrics;
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onRefreshScan: () => void;
  isScanning: boolean;
  onOpenSimulator: () => void;
  onOpenSettings: () => void;
  schedulerEnabled?: boolean;
  currentUser?: UserProfile | null;
  onOpenUpgradeModal?: () => void;
  onLogout?: () => void;
  onLoginClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  selectedPresetId,
  onSelectPreset,
  onRefreshScan,
  isScanning,
  onOpenSimulator,
  onOpenSettings,
  schedulerEnabled = false,
  currentUser,
  onOpenUpgradeModal,
  onLogout,
  onLoginClick,
}) => {
  return (
    <header className="h-20 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50 text-slate-200 sticky top-0 z-30 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-xl font-bold tracking-tight text-white">
                CLOUDOPTIMIZER <span className="text-indigo-400">AI</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono tracking-wide hidden sm:block">
              DIAGNÓSTICO Y LIBERACIÓN TÁCTICA DE GOOGLE
            </p>
          </div>
        </div>

        {/* Status & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile / Login status */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 pl-2.5">
              {currentUser.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.nombre}
                  className="w-7 h-7 rounded-full border border-indigo-500/40 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <User className="w-4 h-4" />
                </div>
              )}

              <div className="hidden md:block text-left">
                <span className="text-xs font-bold text-white block truncate max-w-[100px]">
                  {currentUser.nombre}
                </span>
                <span className="text-[9px] text-slate-400 block truncate max-w-[100px]">
                  {currentUser.email}
                </span>
              </div>

              {currentUser.plan === "PRO" ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>PRO</span>
                </span>
              ) : (
                <button
                  onClick={onOpenUpgradeModal}
                  className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow transition-all active:scale-95"
                >
                  <Crown className="w-3 h-3 fill-current" />
                  <span>MEJORAR A PRO</span>
                </button>
              )}

              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors ml-1"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-md flex items-center gap-1.5 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Conectar Google</span>
            </button>
          )}

          {/* Refresh Scan Button */}
          <button
            onClick={onRefreshScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
            title="Ejecutar análisis en tiempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span className="hidden lg:inline">{isScanning ? "Analizando..." : "Escanear"}</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            title="Configuración y Programador de Limpieza Mensual"
          >
            <Settings className="w-4 h-4 text-indigo-400" />
            {schedulerEnabled && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-950 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
