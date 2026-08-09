import React, { useState } from "react";
import { Cpu, Sparkles, Send, Copy, Check, MessageSquare, Bot, AlertTriangle, RefreshCw, Crown } from "lucide-react";
import { StorageMetrics, AiReport } from "../types";

interface AiAdvisorPanelProps {
  metrics: StorageMetrics;
  onApplyFilterToSearch?: (filter: string) => void;
  onOpenUpgradeModal?: (reason?: string) => void;
}

export const AiAdvisorPanel: React.FC<AiAdvisorPanelProps> = ({
  metrics,
  onOpenUpgradeModal,
}) => {
  const [report, setReport] = useState<AiReport | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Chat states
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; content: string }>>([
    {
      sender: "ai",
      content:
        "Hola. Soy tu Asistente Táctico de CloudOptimizer AI (Gemini 2.0 Flash). ¿En qué canal o servicio te gustaría enfocarte para liberar espacio?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Trigger Gemini AI Report Generation
  const fetchAiReport = async () => {
    setIsLoadingReport(true);
    setReportError(null);
    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            totalGb: metrics.totalGb,
            usedGb: metrics.usedGb,
            usedPercentage: metrics.usedPercentage,
            heavyEmailsCount: metrics.heavyEmailsCount,
            duplicatePhotosCount: metrics.duplicatePhotosCount,
            oldDriveFilesCount: metrics.oldDriveFilesCount,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.limitReached && onOpenUpgradeModal) {
          onOpenUpgradeModal(data.message);
        }
        throw new Error(data.message || data.error || "Error al conectar con Gemini AI");
      }
      setReport(data.result);
    } catch (err: any) {
      setReportError(err.message || "Error al generar informe de IA");
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Send message to Gemini Chat
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSendingMessage) return;

    const userText = inputMessage.trim();
    setInputMessage("");
    const newMessages = [...messages, { sender: "user" as const, content: userText }];
    setMessages(newMessages);
    setIsSendingMessage(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          storageState: {
            totalGb: metrics.totalGb,
            usedGb: metrics.usedGb,
            usedPercentage: metrics.usedPercentage,
            heavyEmailsCount: metrics.heavyEmailsCount,
            duplicatePhotosCount: metrics.duplicatePhotosCount,
            oldDriveFilesCount: metrics.oldDriveFilesCount,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.limitReached && onOpenUpgradeModal) {
          onOpenUpgradeModal(data.message);
        }
        throw new Error(data.message || data.error || "Error en el chat");
      }

      setMessages((prev) => [...prev, { sender: "ai", content: data.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          content: `⚠️ Disculpas: ${err.message}`,
        },
      ]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Diagnóstico Inteligente Gemini 2.0 Flash</span>
            </h3>
            <p className="text-xs text-slate-400">
              Genera estrategias personalizadas y filtros exactos mediante IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>{chatOpen ? "Ocultar Chat" : "Chat IA"}</span>
          </button>

          <button
            onClick={fetchAiReport}
            disabled={isLoadingReport}
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all active:scale-95"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isLoadingReport ? "animate-spin" : ""}`} />
            <span>{isLoadingReport ? "Analizando..." : "Generar Informe IA"}</span>
          </button>
        </div>
      </div>

      {/* Main Report View */}
      {reportError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{reportError}</span>
          </div>

          {onOpenUpgradeModal && (
            <button
              onClick={() => onOpenUpgradeModal(reportError)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Pásate a Pro</span>
            </button>
          )}
        </div>
      )}

      {!report && !isLoadingReport && !reportError && (
        <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 p-6 space-y-3">
          <Bot className="w-10 h-10 text-purple-400 mx-auto opacity-80" />
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-white">
              ¿Quieres un plan personalizado de liberación?
            </h4>
            <p className="text-xs text-slate-400">
              Haz clic en "Generar Informe IA" para consultar a Gemini 2.0 Flash. Obtendrás un análisis de causas principales, filtros de búsqueda en Gmail/Drive y consejos de prevención.
            </p>
          </div>
          <button
            onClick={fetchAiReport}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Diagnóstico Gemini</span>
          </button>
        </div>
      )}

      {isLoadingReport && (
        <div className="py-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-300">
            Consultando modelo Gemini 2.0 Flash... Sintetizando vectores de saturación.
          </p>
        </div>
      )}

      {report && !isLoadingReport && (
        <div className="space-y-4">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Resumen Ejecutivo Diagnóstico
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Principal Causa: <strong className="text-white">{report.primaryVector}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{report.executiveSummary}</p>
          </div>

          {/* Action Plan */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              Hoja de Ruta Táctica Sugerida por la IA
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.actionPlan.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {step.step}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-semibold">
                      Liberar ~{step.estimatedReleaseGb}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-white">{step.title}</h5>

                  {step.searchFilter && (
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px]">
                      <code className="font-mono text-cyan-300 truncate select-all">
                        {step.searchFilter}
                      </code>
                      <button
                        onClick={() => copyToClipboard(step.searchFilter, idx)}
                        className="text-slate-400 hover:text-white ml-2"
                        title="Copiar filtro"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 leading-normal">
                    🛡️ <strong className="text-slate-300">Seguridad:</strong> {step.safetyAdvice}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Proactive Prevention */}
          {report.proactivePrevention && report.proactivePrevention.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-2">
              <h5 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>💡 Reglas de Prevención Proactiva de Saturación:</span>
              </h5>
              <ul className="space-y-1 text-xs text-slate-300">
                {report.proactivePrevention.map((prevRule, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{prevRule}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Interactive Chat Widget */}
      {chatOpen && (
        <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>Asistente Táctico de Consultas Gemini</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Respuesta en Tiempo Real</span>
          </div>

          <div className="h-48 overflow-y-auto space-y-2 text-xs pr-1">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl max-w-[85%] ${
                  m.sender === "user"
                    ? "ml-auto bg-indigo-600 text-white font-medium"
                    : "mr-auto bg-slate-900 border border-slate-800 text-slate-200"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ej: ¿Cómo elimino copias de seguridad de WhatsApp en Drive?"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={isSendingMessage || !inputMessage.trim()}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
