import React, { useState } from "react";
import {
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  HardDrive,
  Mail,
  ImageIcon,
  CheckCircle2,
  ArrowRight,
  Eye,
  Cpu,
} from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onExploreDemo: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onExploreDemo,
}) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleStartGoogleOAuth = async () => {
    try {
      setIsLoggingIn(true);
      setAuthError(null);

      const res = await fetch("/api/auth/google/url");
      const data = await res.json();

      if (!data.authUrl) {
        throw new Error("No se pudo obtener la URL de autenticación de Google.");
      }

      // Open OAuth popup window
      const width = 500;
      const height = 650;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authUrl,
        "GoogleOAuthWindow",
        `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=yes`
      );

      // Listen for popup message completion
      const messageListener = (event: MessageEvent) => {
        if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
          window.removeEventListener("message", messageListener);
          setIsLoggingIn(false);
          onLoginSuccess();
        }
      };

      window.addEventListener("message", messageListener);

      // Fallback timer check if popup closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          setIsLoggingIn(false);
        }
      }, 1000);
    } catch (err: any) {
      setIsLoggingIn(false);
      setAuthError(err.message || "Error al conectar con Google.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>CloudOptimizer</span>
              <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                AI 2.0
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Diagnóstico de Almacenamiento
            </p>
          </div>
        </div>

        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors font-semibold"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Privacidad</span>
        </a>
      </div>

      {/* Main Content Hero Card */}
      <div className="max-w-2xl w-full mx-auto my-auto py-8 z-10 space-y-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Impulsado por Gemini 2.0 Flash</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Optimiza tu espacio en Google sin pagar suscripciones extra
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
            Analiza correos pesados en Gmail, fotos duplicadas en Google Photos y archivos obsoletos en Drive en segundos con IA.
          </p>
        </div>

        {/* Feature Icons Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
            <Mail className="w-5 h-5 text-indigo-400 mx-auto" />
            <span className="text-xs font-bold text-slate-200 block">Gmail</span>
            <span className="text-[10px] text-slate-400 font-mono block">Adjuntos &gt;10MB</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
            <ImageIcon className="w-5 h-5 text-cyan-400 mx-auto" />
            <span className="text-xs font-bold text-slate-200 block">Photos</span>
            <span className="text-[10px] text-slate-400 font-mono block">Duplicados IA</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
            <HardDrive className="w-5 h-5 text-amber-400 mx-auto" />
            <span className="text-xs font-bold text-slate-200 block">Drive</span>
            <span className="text-[10px] text-slate-400 font-mono block">Archivos obsoletos</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-4 space-y-3 max-w-md mx-auto">
          {authError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 text-left">
              {authError}
            </div>
          )}

          <button
            onClick={handleStartGoogleOAuth}
            disabled={isLoggingIn}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoggingIn ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Conectando con Google...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.761H12.545z" />
                </svg>
                <span>Conectar con Google OAuth 2.0</span>
                <ArrowRight className="w-4 h-4 ml-auto text-cyan-200" />
              </>
            )}
          </button>

          <button
            onClick={onExploreDemo}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Explorar en Modo Demostración (Sin Iniciar Sesión)</span>
          </button>
        </div>

        {/* Security & Privacy Badges */}
        <div className="pt-4 border-t border-slate-800/80 max-w-md mx-auto space-y-2">
          <p className="text-xs text-cyan-300/90 font-medium bg-cyan-950/40 border border-cyan-500/20 p-2.5 rounded-xl">
            🔒 <strong>Garantía de Privacidad:</strong> Solo leemos metadatos. Nunca accedemos al contenido de tus archivos.
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5 justify-center">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permisos de Solo Lectura</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Cero Almacenamiento</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 pt-4 z-10">
        <p>CloudOptimizer AI v2.0 • Cumplimiento Google Play Store & OAuth Security Standards</p>
      </div>
    </div>
  );
};
