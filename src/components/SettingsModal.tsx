import React, { useState, useEffect } from "react";
import {
  Settings,
  X,
  Calendar,
  Clock,
  Bell,
  Check,
  TrendingUp,
  AlertCircle,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { StorageMetrics } from "../types";

export interface SchedulerConfig {
  enabled: boolean;
  dayOfMonth: number; // 1 to 28
  thresholdAlertPercent: number; // e.g. 85 or 90
  lastScanDate: string; // ISO date string
  projectedGrowthGbPerMonth: number;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchedulerConfig;
  onUpdateConfig: (newConfig: SchedulerConfig) => void;
  metrics: StorageMetrics;
  onTriggerScheduledScanPrompt: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  metrics,
  onTriggerScheduledScanPrompt,
}) => {
  const [localConfig, setLocalConfig] = useState<SchedulerConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  // Calculate next scan date based on selected dayOfMonth
  const getNextScanDateStr = () => {
    const today = new Date();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), localConfig.dayOfMonth);
    if (nextDate <= today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, localConfig.dayOfMonth);
    }
    return nextDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Estimate months until 100% full at current growth velocity
  const freeGbLeft = metrics.freeGb;
  const growthRate = localConfig.projectedGrowthGbPerMonth || 1.2;
  const monthsRemaining = growthRate > 0 ? (freeGbLeft / growthRate).toFixed(1) : "N/A";

  const handleToggleScheduler = () => {
    const updated = { ...localConfig, enabled: !localConfig.enabled };
    setLocalConfig(updated);
  };

  const handleSave = () => {
    onUpdateConfig(localConfig);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Configuración del Sistema
              </h3>
              <p className="text-xs text-slate-400">
                Programación de mantenimiento e inteligencia de consumo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Cleanup Scheduler Toggle Card */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Programador de Limpieza Mensual</span>
                  {localConfig.enabled && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Activo
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Genera recordatorios automáticos de análisis preventivo según tu tasa de uso.
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleScheduler}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                localConfig.enabled ? "bg-indigo-600" : "bg-slate-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  localConfig.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Expanded Controls when Enabled */}
          {localConfig.enabled && (
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Día de ejecución mensual</span>
                </label>
                <select
                  value={localConfig.dayOfMonth}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, dayOfMonth: Number(e.target.value) })
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1}>Día 1 de cada mes</option>
                  <option value={5}>Día 5 de cada mes</option>
                  <option value={15}>Día 15 de cada mes</option>
                  <option value={28}>Día 28 de cada mes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Umbral de Alerta Crítica</span>
                </label>
                <select
                  value={localConfig.thresholdAlertPercent}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      thresholdAlertPercent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={80}>Al superar 80% de ocupación</option>
                  <option value={85}>Al superar 85% de ocupación</option>
                  <option value={90}>Al superar 90% de ocupación (Recomendado)</option>
                  <option value={95}>Al superar 95% de ocupación</option>
                </select>
              </div>

              <div className="sm:col-span-2 bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Próximo escaneo automático:</span>
                <span className="text-indigo-300 font-bold">{getNextScanDateStr()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Usage Pattern Intelligence */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Análisis de Patrón de Consumo Promedio
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">
                Acumulación estimada
              </span>
              <p className="text-lg font-bold text-cyan-400 font-mono">
                +{localConfig.projectedGrowthGbPerMonth} GB / mes
              </p>
              <p className="text-[10px] text-slate-500">
                Basado en archivos pesados y adjuntos de Gmail.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">
                Tiempo hasta saturación
              </span>
              <p className="text-lg font-bold text-rose-400 font-mono">
                ~{monthsRemaining} meses
              </p>
              <p className="text-[10px] text-slate-500">
                Si no se realizan purgas periódicas.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Test Notification Action */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onTriggerScheduledScanPrompt}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Probar Recordatorio de Escaneo Ahora</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors w-1/2 sm:w-auto text-center"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 w-1/2 sm:w-auto"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
