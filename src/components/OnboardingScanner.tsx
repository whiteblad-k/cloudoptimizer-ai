import React, { useEffect, useState } from "react";
import { Cpu, CheckCircle2, ShieldCheck, Mail, HardDrive, ImageIcon, Sparkles } from "lucide-react";

interface OnboardingScannerProps {
  onScanComplete: (scannedData: any) => void;
}

export const OnboardingScanner: React.FC<OnboardingScannerProps> = ({ onScanComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(10);
  const [statusMessage, setStatusMessage] = useState<string>("Iniciando conexión segura con Google APIs...");

  useEffect(() => {
    let isMounted = true;

    async function runRealScan() {
      try {
        // Step 1: Quota API
        if (isMounted) {
          setStep(1);
          setProgress(25);
          setStatusMessage("Obteniendo datos de cuota real de Google Drive...");
        }
        const quotaRes = await fetch("/api/storage/quota");
        const quota = await quotaRes.json();

        // Step 2: Gmail API
        if (isMounted) {
          setStep(2);
          setProgress(50);
          setStatusMessage("Escaneando correos con adjuntos pesados (>10MB) en Gmail...");
        }
        const gmailRes = await fetch("/api/gmail/heavy-emails");
        const gmailData = await gmailRes.json();

        // Step 3: Drive Stale Files API
        if (isMounted) {
          setStep(3);
          setProgress(75);
          setStatusMessage("Analizando archivos sin modificar en Google Drive...");
        }
        const driveRes = await fetch("/api/drive/old-files");
        const driveData = await driveRes.json();

        // Step 4: Photos Storage
        if (isMounted) {
          setStep(4);
          setProgress(90);
          setStatusMessage("Calculando estimación de álbumes y fotos en Google Photos...");
        }
        const photosRes = await fetch("/api/photos/storage-usage");
        const photosData = await photosRes.json();

        // Finalize
        if (isMounted) {
          setStep(5);
          setProgress(100);
          setStatusMessage("¡Análisis completado exitosamente!");
        }

        setTimeout(() => {
          if (isMounted) {
            onScanComplete({
              quota,
              gmailData,
              driveData,
              photosData,
            });
          }
        }, 1200);
      } catch (err) {
        console.error("Scan error:", err);
        // Fallback to completion
        if (isMounted) {
          setProgress(100);
          onScanComplete(null);
        }
      }
    }

    runRealScan();

    return () => {
      isMounted = false;
    };
  }, [onScanComplete]);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-80 h-80 bg-cyan-600/20 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl relative z-10">
        {/* Animated Scanner Ring */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 border-t-cyan-400 animate-spin" />
          <div className="w-16 h-16 rounded-2xl bg-indigo-950 flex items-center justify-center border border-indigo-500/30">
            <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Escaneando tu Almacenamiento en la Nube
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analizando metadatos de tamaño y antigüedad mediante Google APIs en tiempo real
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
            <span>{statusMessage}</span>
            <span className="text-cyan-400">{progress}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Scan Checklist */}
        <div className="space-y-2.5 text-left text-xs font-semibold pt-2 border-t border-slate-800">
          <div className={`flex items-center gap-2.5 transition-opacity ${step >= 1 ? "opacity-100 text-slate-200" : "opacity-40 text-slate-500"}`}>
            {step >= 1 ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <HardDrive className="w-4 h-4" />}
            <span>Cuota de almacenamiento total de la cuenta</span>
          </div>

          <div className={`flex items-center gap-2.5 transition-opacity ${step >= 2 ? "opacity-100 text-slate-200" : "opacity-40 text-slate-500"}`}>
            {step >= 2 ? <CheckCircle2 className="w-4 h-4 text-indigo-400" /> : <Mail className="w-4 h-4" />}
            <span>Correos pesados con adjuntos en Gmail (&gt;10MB)</span>
          </div>

          <div className={`flex items-center gap-2.5 transition-opacity ${step >= 3 ? "opacity-100 text-slate-200" : "opacity-40 text-slate-500"}`}>
            {step >= 3 ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <HardDrive className="w-4 h-4" />}
            <span>Archivos no modificados en Google Drive</span>
          </div>

          <div className={`flex items-center gap-2.5 transition-opacity ${step >= 4 ? "opacity-100 text-slate-200" : "opacity-40 text-slate-500"}`}>
            {step >= 4 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ImageIcon className="w-4 h-4" />}
            <span>Identificación de ráfagas y duplicados en Photos</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acceso de solo lectura • Zero Data Retention</span>
        </div>
      </div>
    </div>
  );
};
