import React, { useState } from "react";
import { Sliders, X, RefreshCw, Check } from "lucide-react";

interface SimulatorControlsProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: {
    total_gb: number;
    used_gb: number;
    heavy_emails: number;
    duplicate_photos: number;
    old_drive_files: number;
  };
  onApplyCustomData: (data: {
    total_gb: number;
    used_gb: number;
    heavy_emails: number;
    duplicate_photos: number;
    old_drive_files: number;
  }) => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  isOpen,
  onClose,
  currentData,
  onApplyCustomData,
}) => {
  if (!isOpen) return null;

  const [totalGb, setTotalGb] = useState<number>(currentData.total_gb);
  const [usedGb, setUsedGb] = useState<number>(currentData.used_gb);
  const [heavyEmails, setHeavyEmails] = useState<number>(currentData.heavy_emails);
  const [duplicatePhotos, setDuplicatePhotos] = useState<number>(currentData.duplicate_photos);
  const [oldDriveFiles, setOldDriveFiles] = useState<number>(currentData.old_drive_files);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyCustomData({
      total_gb: Number(totalGb),
      used_gb: Number(usedGb),
      heavy_emails: Number(heavyEmails),
      duplicate_photos: Number(duplicatePhotos),
      old_drive_files: Number(oldDriveFiles),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Ajuste Manual de Parámetros de Diagnóstico
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Total Almacenamiento (GB)</label>
              <input
                type="number"
                step="0.1"
                value={totalGb}
                onChange={(e) => setTotalGb(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Espacio Usado (GB)</label>
              <input
                type="number"
                step="0.1"
                value={usedGb}
                onChange={(e) => setUsedGb(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Correos Pesados (Adjuntos &gt; 10MB)
            </label>
            <input
              type="number"
              value={heavyEmails}
              onChange={(e) => setHeavyEmails(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Fotos Duplicadas y Borrosas
            </label>
            <input
              type="number"
              value={duplicatePhotos}
              onChange={(e) => setDuplicatePhotos(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Archivos en Drive sin modificar (&gt; 2 Años)
            </label>
            <input
              type="number"
              value={oldDriveFiles}
              onChange={(e) => setOldDriveFiles(parseInt(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Diagnóstico</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
