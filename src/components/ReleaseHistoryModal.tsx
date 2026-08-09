import React from "react";
import { History, X, CheckCircle2, ShieldCheck, Trash2, Download, FileJson } from "lucide-react";
import { ActionLogItem } from "../types";

interface ReleaseHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ActionLogItem[];
  totalFreedSessionGb: number;
  onResetSession: () => void;
}

export const ReleaseHistoryModal: React.FC<ReleaseHistoryModalProps> = ({
  isOpen,
  onClose,
  logs,
  totalFreedSessionGb,
  onResetSession,
}) => {
  if (!isOpen) return null;

  const handleExportJson = () => {
    const exportData = {
      app: "CloudOptimizer AI",
      exportedAt: new Date().toISOString(),
      sessionSummary: {
        totalFreedSessionGb: Number(totalFreedSessionGb.toFixed(2)),
        totalActionsExecuted: logs.length,
      },
      cleanupLogs: logs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudoptimizer-cleanup-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Historial de Purgas Tácticas Ejecutadas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Freed Summary */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold uppercase text-emerald-400 tracking-wider block">
              Total Espacio Recuperado
            </span>
            <p className="text-3xl font-black text-white font-mono">
              {totalFreedSessionGb.toFixed(2)} GB
            </p>
          </div>

          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex-shrink-0"
            title="Descargar resumen de la sesión en formato JSON"
          >
            <FileJson className="w-4 h-4 text-cyan-300" />
            <span>Exportar JSON</span>
          </button>
        </div>

        {/* Log Entries */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-slate-500">
              No se han realizado purgas tácticas en esta sesión.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div>
                    <h5 className="font-bold text-white">{log.actionName}</h5>
                    <p className="text-[10px] text-slate-400">
                      {log.itemsAffected} elementos procesados • {log.timestamp}
                    </p>
                  </div>
                </div>

                <span className="font-mono font-bold text-emerald-400 text-xs">
                  +{log.gbFreed.toFixed(2)} GB
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={onResetSession}
            className="text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Restablecer Estado Inicial</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
