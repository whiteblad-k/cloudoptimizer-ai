import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { StorageGaugeCard } from "./components/StorageGaugeCard";
import { BreakdownChart } from "./components/BreakdownChart";
import { TacticalRecommendations } from "./components/TacticalRecommendations";
import { GranularItemViewer } from "./components/GranularItemViewer";
import { AiAdvisorPanel } from "./components/AiAdvisorPanel";
import { SimulatorControls } from "./components/SimulatorControls";
import { ReleaseHistoryModal } from "./components/ReleaseHistoryModal";
import { SettingsModal, SchedulerConfig } from "./components/SettingsModal";
import { LoginScreen } from "./components/LoginScreen";
import { OnboardingScanner } from "./components/OnboardingScanner";
import { UpgradeProModal } from "./components/UpgradeProModal";
import {
  PRESET_PROFILES,
  INITIAL_HEAVY_EMAILS,
  INITIAL_DUPLICATE_GROUPS,
  INITIAL_OLD_DRIVE_FILES,
  INITIAL_TRASH_ITEMS,
} from "./data/mockData";
import {
  StorageMetrics,
  SaturationVectors,
  RecommendationItem,
  HeavyEmail,
  DuplicatePhotoGroup,
  OldDriveFile,
  TrashItem,
  ActionLogItem,
  UserProfile,
} from "./types";
import { History, Sparkles, FileJson, Calendar, RefreshCw } from "lucide-react";

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  enabled: true,
  dayOfMonth: 1,
  thresholdAlertPercent: 90,
  lastScanDate: new Date().toISOString(),
  projectedGrowthGbPerMonth: 1.25,
};

export default function App() {
  // Auth & Mode state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [exploreDemo, setExploreDemo] = useState<boolean>(false);
  const [isScanningReal, setIsScanningReal] = useState<boolean>(false);

  // Upgrade Pro Modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false);
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>(undefined);

  const [selectedPresetId, setSelectedPresetId] = useState<string>("user_prototype");

  // Items State
  const [heavyEmails, setHeavyEmails] = useState<HeavyEmail[]>(INITIAL_HEAVY_EMAILS);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicatePhotoGroup[]>(INITIAL_DUPLICATE_GROUPS);
  const [oldDriveFiles, setOldDriveFiles] = useState<OldDriveFile[]>(INITIAL_OLD_DRIVE_FILES);
  const [trashItems, setTrashItems] = useState<TrashItem[]>(INITIAL_TRASH_ITEMS);

  // Raw counts override for current profile
  const [profileParams, setProfileParams] = useState({
    total_gb: 15.0,
    used_gb: 14.8,
    heavy_emails: 45,
    duplicate_photos: 1200,
    old_drive_files: 34,
  });

  // Diagnostic API State
  const [metrics, setMetrics] = useState<StorageMetrics>({
    totalGb: 15.0,
    usedGb: 14.8,
    freeGb: 0.2,
    usedPercentage: 99,
    status: "CRITICAL",
    totalPotentialFreedGb: 6.8,
    projectedUsedGbAfterCleanup: 8.0,
    projectedPercentage: 53,
    annualSavingsUsd: 23.88,
    heavyEmailsCount: 45,
    duplicatePhotosCount: 1200,
    oldDriveFilesCount: 34,
  });

  const [vectors, setVectors] = useState<SaturationVectors>({
    heavyEmailsGb: 2.48,
    duplicatePhotosGb: 4.2,
    oldDriveFilesGb: 4.08,
    trashCacheGb: 1.18,
  });

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [activeTab, setActiveTab] = useState<"EMAILS" | "PHOTOS" | "DRIVE_FILES" | "TRASH">("EMAILS");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Cleanup Scheduler State
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(() => {
    try {
      const saved = localStorage.getItem("cloudoptimizer_scheduler_config");
      return saved ? JSON.parse(saved) : DEFAULT_SCHEDULER_CONFIG;
    } catch {
      return DEFAULT_SCHEDULER_CONFIG;
    }
  });

  const [scheduledPromptActive, setScheduledPromptActive] = useState<boolean>(false);

  // Check Auth on Mount
  const checkAuthStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setIsScanningReal(true);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setExploreDemo(false);
    showToast("Sesión cerrada correctamente.");
  };

  const handleUpdateSchedulerConfig = (newConfig: SchedulerConfig) => {
    setSchedulerConfig(newConfig);
    try {
      localStorage.setItem("cloudoptimizer_scheduler_config", JSON.stringify(newConfig));
    } catch (e) {
      console.error("Failed to save scheduler config:", e);
    }
    showToast("Configuración del programador guardada.");
  };

  // Check if monthly scheduled prompt should be shown
  useEffect(() => {
    if (schedulerConfig.enabled && metrics.usedPercentage >= schedulerConfig.thresholdAlertPercent) {
      setScheduledPromptActive(true);
    }
  }, [metrics.usedPercentage, schedulerConfig.enabled, schedulerConfig.thresholdAlertPercent]);

  // Logs & Freed Session Space
  const [actionLogs, setActionLogs] = useState<ActionLogItem[]>([]);
  const [totalFreedSessionGb, setTotalFreedSessionGb] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Run Diagnostic Engine
  const runDiagnosticAnalysis = useCallback(
    async (params = profileParams) => {
      setIsScanning(true);
      try {
        const res = await fetch("/api/storage/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const data = await res.json();
        if (res.ok && data.summary) {
          setMetrics({
            totalGb: data.summary.totalGb,
            usedGb: data.summary.usedGb,
            freeGb: data.summary.freeGb,
            usedPercentage: data.summary.usedPercentage,
            status: data.summary.status,
            totalPotentialFreedGb: data.summary.totalPotentialFreedGb,
            projectedUsedGbAfterCleanup: data.summary.projectedUsedGbAfterCleanup,
            projectedPercentage: data.summary.projectedPercentage,
            annualSavingsUsd: data.summary.annualSavingsUsd,
            heavyEmailsCount: params.heavy_emails,
            duplicatePhotosCount: params.duplicate_photos,
            oldDriveFilesCount: params.old_drive_files,
          });
          setVectors(data.vectors);
          setRecommendations(data.recommendations || []);
        }
      } catch (err) {
        console.error("Error executing diagnostic engine:", err);
      } finally {
        setTimeout(() => setIsScanning(false), 500);
      }
    },
    [profileParams]
  );

  useEffect(() => {
    if (!isScanningReal) {
      runDiagnosticAnalysis(profileParams);
    }
  }, [profileParams, runDiagnosticAnalysis, isScanningReal]);

  // Complete Real Google API Scan
  const handleRealScanComplete = (scannedData: any) => {
    setIsScanningReal(false);

    if (scannedData) {
      const { quota, gmailData, driveData } = scannedData;

      if (quota) {
        const newParams = {
          total_gb: quota.totalGb || 15.0,
          used_gb: quota.usedGb || 14.8,
          heavy_emails: gmailData?.count || 12,
          duplicate_photos: 180,
          old_drive_files: driveData?.count || 8,
        };

        setProfileParams(newParams);

        if (gmailData?.heavyEmails && gmailData.heavyEmails.length > 0) {
          setHeavyEmails(gmailData.heavyEmails);
        }

        if (driveData?.oldFiles && driveData.oldFiles.length > 0) {
          setOldDriveFiles(driveData.oldFiles);
        }

        runDiagnosticAnalysis(newParams);
        showToast("¡Datos reales sincronizados desde Google APIs!");
      }
    }
  };

  // Handle Preset Change
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const profile = PRESET_PROFILES.find((p) => p.id === presetId);
    if (profile) {
      const newParams = {
        total_gb: profile.total_gb,
        used_gb: profile.used_gb,
        heavy_emails: profile.heavy_emails,
        duplicate_photos: profile.duplicate_photos,
        old_drive_files: profile.old_drive_files,
      };
      setProfileParams(newParams);
      showToast(`Cargado perfil de diagnóstico: ${profile.name}`);
    }
  };

  // Actions for Purging
  const addActionLog = (
    actionName: string,
    category: "GMAIL" | "PHOTOS" | "DRIVE" | "SYSTEM",
    gbFreed: number,
    itemsCount: number
  ) => {
    const newLog: ActionLogItem = {
      id: "log_" + Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      actionName,
      category,
      gbFreed,
      itemsAffected: itemsCount,
    };
    setActionLogs((prev) => [newLog, ...prev]);
    setTotalFreedSessionGb((prev) => Number((prev + gbFreed).toFixed(2)));

    setProfileParams((prev) => {
      const updatedUsedGb = Math.max(0, Number((prev.used_gb - gbFreed).toFixed(2)));
      return { ...prev, used_gb: updatedUsedGb };
    });

    showToast(`✓ Se liberaron ~${gbFreed.toFixed(2)} GB (${actionName})`);
  };

  const handleDeleteEmails = (idsToDelete: string[]) => {
    const deletedList = heavyEmails.filter((e) => idsToDelete.includes(e.id));
    const freedMb = deletedList.reduce((acc, e) => acc + e.sizeMb, 0);
    const freedGb = Number((freedMb / 1024).toFixed(2));

    setHeavyEmails((prev) => prev.filter((e) => !idsToDelete.includes(e.id)));
    setProfileParams((prev) => ({
      ...prev,
      heavy_emails: Math.max(0, prev.heavy_emails - idsToDelete.length),
    }));

    addActionLog("Eliminación de Correos Pesados", "GMAIL", freedGb, idsToDelete.length);
  };

  const handleDeleteDuplicatePhotos = (groupIdsToDelete: string[]) => {
    const deletedGroups = duplicateGroups.filter((g) => groupIdsToDelete.includes(g.id));
    const freedMb = deletedGroups.reduce((acc, g) => acc + g.potentialSavedMb, 0);
    const freedGb = Number((freedMb / 1024).toFixed(2));

    setDuplicateGroups((prev) => prev.filter((g) => !groupIdsToDelete.includes(g.id)));
    setProfileParams((prev) => ({
      ...prev,
      duplicate_photos: Math.max(0, prev.duplicate_photos - 350 * groupIdsToDelete.length),
    }));

    addActionLog("Purga de Fotos Duplicadas", "PHOTOS", freedGb, deletedGroups.length * 3);
  };

  const handleDeleteOldDriveFiles = (idsToDelete: string[]) => {
    const deletedList = oldDriveFiles.filter((d) => idsToDelete.includes(d.id));
    const freedMb = deletedList.reduce((acc, d) => acc + d.sizeMb, 0);
    const freedGb = Number((freedMb / 1024).toFixed(2));

    setOldDriveFiles((prev) => prev.filter((d) => !idsToDelete.includes(d.id)));
    setProfileParams((prev) => ({
      ...prev,
      old_drive_files: Math.max(0, prev.old_drive_files - idsToDelete.length),
    }));

    addActionLog("Archivado de Documentos Obsoletos Drive", "DRIVE", freedGb, idsToDelete.length);
  };

  const handlePurgeTrashItems = (idsToDelete: string[]) => {
    const deletedList = trashItems.filter((t) => idsToDelete.includes(t.id));
    const freedGb = Number(deletedList.reduce((acc, t) => acc + t.sizeGb, 0).toFixed(2));

    setTrashItems((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));
    addActionLog("Vaciamiento de Papeleras del Sistema", "SYSTEM", freedGb, deletedList.length);
  };

  const handleExecuteRecommendation = (rec: RecommendationItem) => {
    if (rec.actionableType === "EMAILS") {
      handleDeleteEmails(heavyEmails.map((e) => e.id));
    } else if (rec.actionableType === "PHOTOS") {
      handleDeleteDuplicatePhotos(duplicateGroups.map((g) => g.id));
    } else if (rec.actionableType === "DRIVE_FILES") {
      handleDeleteOldDriveFiles(oldDriveFiles.map((d) => d.id));
    } else if (rec.actionableType === "TRASH") {
      handlePurgeTrashItems(trashItems.map((t) => t.id));
    }
  };

  const handleQuickPurgeAll = () => {
    handleDeleteEmails(heavyEmails.map((e) => e.id));
    handleDeleteDuplicatePhotos(duplicateGroups.map((g) => g.id));
    handleDeleteOldDriveFiles(oldDriveFiles.map((d) => d.id));
    handlePurgeTrashItems(trashItems.map((t) => t.id));
  };

  const handleResetSession = () => {
    setHeavyEmails(INITIAL_HEAVY_EMAILS);
    setDuplicateGroups(INITIAL_DUPLICATE_GROUPS);
    setOldDriveFiles(INITIAL_OLD_DRIVE_FILES);
    setTrashItems(INITIAL_TRASH_ITEMS);
    setProfileParams({
      total_gb: 15.0,
      used_gb: 14.8,
      heavy_emails: 45,
      duplicate_photos: 1200,
      old_drive_files: 34,
    });
    setActionLogs([]);
    setTotalFreedSessionGb(0);
    showToast("Restablecido a estado inicial.");
  };

  const handleExportJson = () => {
    const exportData = {
      app: "CloudOptimizer AI",
      exportedAt: new Date().toISOString(),
      sessionSummary: {
        totalFreedSessionGb: Number(totalFreedSessionGb.toFixed(2)),
        totalActionsExecuted: actionLogs.length,
      },
      cleanupLogs: actionLogs,
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
    showToast("Historial de sesión exportado en JSON");
  };

  // 1. Initial auth check loading
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Not logged in and not exploring demo -> Show Login Screen
  if (!currentUser && !exploreDemo) {
    return (
      <LoginScreen
        onLoginSuccess={() => checkAuthStatus()}
        onExploreDemo={() => setExploreDemo(true)}
      />
    );
  }

  // 3. Logged in and running real scan -> Show Onboarding Scanner
  if (currentUser && isScanningReal) {
    return <OnboardingScanner onScanComplete={handleRealScanComplete} />;
  }

  // 4. Main Dashboard View
  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white pb-16">
      {/* Header */}
      <Header
        metrics={metrics}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onRefreshScan={() => {
          if (currentUser) {
            setIsScanningReal(true);
          } else {
            runDiagnosticAnalysis(profileParams);
          }
        }}
        isScanning={isScanning || isScanningReal}
        onOpenSimulator={() => setSimulatorOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        schedulerEnabled={schedulerConfig.enabled}
        currentUser={currentUser}
        onOpenUpgradeModal={() => {
          setUpgradeReason(undefined);
          setUpgradeModalOpen(true);
        }}
        onLogout={handleLogout}
        onLoginClick={() => setExploreDemo(false)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-24 right-4 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400/30 flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Scheduled Banner */}
        {scheduledPromptActive && schedulerConfig.enabled && (
          <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl flex-shrink-0">
                <Calendar className="w-6 h-6 text-amber-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Programador de Limpieza: Escaneo Mensual Sugerido
                  </h4>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Alerta Programada
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Basado en tu ritmo de acumulación promedio (<strong>+{schedulerConfig.projectedGrowthGbPerMonth} GB/mes</strong>) y tu nivel actual (<strong>{metrics.usedPercentage}%</strong>), es momento de realizar la purga preventiva.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                onClick={() => {
                  runDiagnosticAnalysis(profileParams);
                  setScheduledPromptActive(false);
                  const updated = { ...schedulerConfig, lastScanDate: new Date().toISOString() };
                  handleUpdateSchedulerConfig(updated);
                  showToast("¡Escaneo programado ejecutado con éxito!");
                }}
                disabled={isScanning}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                <span>Ejecutar Escaneo Ahora</span>
              </button>

              <button
                onClick={() => {
                  setScheduledPromptActive(false);
                  showToast("Recordatorio pospuesto por 7 días.");
                }}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Posponer
              </button>
            </div>
          </div>
        )}

        {/* Primary Gauge */}
        <StorageGaugeCard
          metrics={metrics}
          vectors={vectors}
          onQuickPurgeAll={handleQuickPurgeAll}
        />

        {/* Charts & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <BreakdownChart metrics={metrics} vectors={vectors} />
          </div>

          <div className="lg:col-span-7">
            <TacticalRecommendations
              recommendations={recommendations}
              onExecuteRecommendation={handleExecuteRecommendation}
              onSelectTab={(tab) => setActiveTab(tab)}
            />
          </div>
        </div>

        {/* Item Viewer */}
        <GranularItemViewer
          activeTab={activeTab}
          onTabChange={setActiveTab}
          heavyEmails={heavyEmails}
          duplicateGroups={duplicateGroups}
          oldDriveFiles={oldDriveFiles}
          trashItems={trashItems}
          onDeleteEmails={handleDeleteEmails}
          onDeleteDuplicatePhotos={handleDeleteDuplicatePhotos}
          onDeleteOldDriveFiles={handleDeleteOldDriveFiles}
          onPurgeTrashItems={handlePurgeTrashItems}
        />

        {/* Gemini AI Advisor */}
        <AiAdvisorPanel
          metrics={metrics}
          onOpenUpgradeModal={(msg) => {
            setUpgradeReason(msg);
            setUpgradeModalOpen(true);
          }}
        />

        {/* Session Log & Export */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          {actionLogs.length > 0 && (
            <button
              onClick={handleExportJson}
              className="px-3.5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-2xl flex items-center gap-1.5 transition-all active:scale-95 border border-indigo-400/30"
              title="Descargar reporte JSON de la sesión"
            >
              <FileJson className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline">Exportar JSON</span>
            </button>
          )}

          <button
            onClick={() => setHistoryModalOpen(true)}
            className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center gap-2 transition-all active:scale-95 border border-emerald-400/30"
          >
            <History className="w-4 h-4" />
            <span>
              Sesión: <strong className="font-mono">+{totalFreedSessionGb.toFixed(2)} GB Liberados</strong>
            </span>
          </button>
        </div>
      </main>

      {/* Modals */}
      <SimulatorControls
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        currentData={profileParams}
        onApplyCustomData={(data) => {
          setProfileParams(data);
          showToast("Nuevos parámetros de diagnóstico aplicados.");
        }}
      />

      <ReleaseHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        logs={actionLogs}
        totalFreedSessionGb={totalFreedSessionGb}
        onResetSession={handleResetSession}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        config={schedulerConfig}
        onUpdateConfig={handleUpdateSchedulerConfig}
        metrics={metrics}
        onTriggerScheduledScanPrompt={() => {
          setScheduledPromptActive(true);
          showToast("Simulación de notificación de escaneo programado activada.");
        }}
      />

      <UpgradeProModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        reasonMessage={upgradeReason}
        onSuccessUpgrade={() => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, plan: "PRO" });
          }
          showToast("¡Felicidades! Has sido actualizado a Plan Pro Ilimitado.");
        }}
      />
    </div>
  );
}
