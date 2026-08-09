import React, { useState } from "react";
import { X, Sparkles, Check, Zap, Crown, ShieldCheck, ArrowRight } from "lucide-react";

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUpgrade: () => void;
  reasonMessage?: string;
}

export const UpgradeProModal: React.FC<UpgradeProModalProps> = ({
  isOpen,
  onClose,
  onSuccessUpgrade,
  reasonMessage,
}) => {
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("YEARLY");
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const res = await fetch("/api/auth/upgrade-pro", { method: "POST" });
      const data = await res.json();
      setIsUpgrading(false);

      if (data.success) {
        onSuccessUpgrade();
        onClose();
      }
    } catch (err) {
      console.error(err);
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-400" />
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            <Crown className="w-4 h-4" />
            <span>Actualización a Plan Pro</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            Desbloquea Optimización de IA Ilimitada
          </h3>

          {reasonMessage && (
            <p className="text-xs text-amber-300 bg-amber-950/50 border border-amber-500/30 p-2.5 rounded-xl font-medium">
              {reasonMessage}
            </p>
          )}
        </div>

        {/* Cycle Toggle */}
        <div className="flex justify-center">
          <div className="bg-slate-950 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setBillingCycle("MONTHLY")}
              className={`px-4 py-2 rounded-xl transition-all ${
                billingCycle === "MONTHLY"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              $3.99 / mes
            </button>
            <button
              onClick={() => setBillingCycle("YEARLY")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                billingCycle === "YEARLY"
                  ? "bg-amber-500 text-slate-950 shadow font-black"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>$29.99 / año</span>
              <span className="text-[9px] bg-slate-950 text-amber-300 px-1.5 py-0.5 rounded-full uppercase">
                Ahorra 37%
              </span>
            </button>
          </div>
        </div>

        {/* Features Comparison */}
        <div className="space-y-3 bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-bold text-slate-300">
            <span>Característica</span>
            <span className="text-amber-400 font-black">Plan Pro</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Consultas al Chat IA (Gemini 2.0)</span>
            </span>
            <span className="font-bold text-emerald-400">ILIMITADAS</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Informes de Diagnóstico IA</span>
            </span>
            <span className="font-bold text-emerald-400">ILIMITADOS</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-indigo-400" />
              <span>Programador Mensual Automático</span>
            </span>
            <span className="font-bold text-emerald-400">INCLUIDO</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportación de Historial en PDF / JSON</span>
            </span>
            <span className="font-bold text-emerald-400">INCLUIDO</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isUpgrading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Procesando suscripción...</span>
              </div>
            ) : (
              <>
                <Crown className="w-5 h-5 fill-current" />
                <span>
                  Obtener Plan Pro ({billingCycle === "YEARLY" ? "$29.99/año" : "$3.99/mes"})
                </span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cancela cuando quieras • Garantía de satisfacción de 14 días</span>
          </p>
        </div>
      </div>
    </div>
  );
};
