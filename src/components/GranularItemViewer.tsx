import React, { useState } from "react";
import { Mail, Image as ImageIcon, HardDrive, Trash2, CheckSquare, Square, Trash, Sparkles, Filter, AlertCircle, FileArchive, Check } from "lucide-react";
import { HeavyEmail, DuplicatePhotoGroup, OldDriveFile, TrashItem } from "../types";

interface GranularItemViewerProps {
  activeTab: "EMAILS" | "PHOTOS" | "DRIVE_FILES" | "TRASH";
  onTabChange: (tab: "EMAILS" | "PHOTOS" | "DRIVE_FILES" | "TRASH") => void;
  heavyEmails: HeavyEmail[];
  duplicateGroups: DuplicatePhotoGroup[];
  oldDriveFiles: OldDriveFile[];
  trashItems: TrashItem[];
  onDeleteEmails: (ids: string[]) => void;
  onDeleteDuplicatePhotos: (groupIds: string[]) => void;
  onDeleteOldDriveFiles: (ids: string[]) => void;
  onPurgeTrashItems: (ids: string[]) => void;
}

export const GranularItemViewer: React.FC<GranularItemViewerProps> = ({
  activeTab,
  onTabChange,
  heavyEmails,
  duplicateGroups,
  oldDriveFiles,
  trashItems,
  onDeleteEmails,
  onDeleteDuplicatePhotos,
  onDeleteOldDriveFiles,
  onPurgeTrashItems,
}) => {
  // Local selection states
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>(
    heavyEmails.map((e) => e.id)
  );
  const [selectedDriveIds, setSelectedDriveIds] = useState<string[]>(
    oldDriveFiles.map((d) => d.id)
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    duplicateGroups.map((g) => g.id)
  );
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>(
    trashItems.map((t) => t.id)
  );

  // Email toggles
  const toggleSelectEmail = (id: string) => {
    setSelectedEmailIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const toggleSelectAllEmails = () => {
    if (selectedEmailIds.length === heavyEmails.length) setSelectedEmailIds([]);
    else setSelectedEmailIds(heavyEmails.map((e) => e.id));
  };

  // Drive toggles
  const toggleSelectDrive = (id: string) => {
    setSelectedDriveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const toggleSelectAllDrive = () => {
    if (selectedDriveIds.length === oldDriveFiles.length) setSelectedDriveIds([]);
    else setSelectedDriveIds(oldDriveFiles.map((d) => d.id));
  };

  // Duplicate group toggles
  const toggleSelectGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  // Trash toggles
  const toggleSelectTrash = (id: string) => {
    setSelectedTrashIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Calculate selected space saved
  const selectedEmailSpaceGb = Number(
    (
      heavyEmails
        .filter((e) => selectedEmailIds.includes(e.id))
        .reduce((acc, e) => acc + e.sizeMb, 0) / 1024
    ).toFixed(2)
  );

  const selectedDriveSpaceGb = Number(
    (
      oldDriveFiles
        .filter((d) => selectedDriveIds.includes(d.id))
        .reduce((acc, d) => acc + d.sizeMb, 0) / 1024
    ).toFixed(2)
  );

  const selectedDuplicateSpaceGb = Number(
    (
      duplicateGroups
        .filter((g) => selectedGroupIds.includes(g.id))
        .reduce((acc, g) => acc + g.potentialSavedMb, 0) / 1024
    ).toFixed(2)
  );

  const selectedTrashSpaceGb = Number(
    trashItems
      .filter((t) => selectedTrashIds.includes(t.id))
      .reduce((acc, t) => acc + t.sizeGb, 0)
      .toFixed(2)
  );

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
      {/* Tab Navigation */}
      <div
        role="tablist"
        aria-label="Categorías de análisis de almacenamiento"
        className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-4"
      >
        <button
          id="tab-EMAILS"
          role="tab"
          aria-selected={activeTab === "EMAILS"}
          aria-controls="tabpanel-EMAILS"
          onClick={() => onTabChange("EMAILS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            activeTab === "EMAILS"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Mail className="w-4 h-4" aria-hidden="true" />
          <span>Correos Pesados ({heavyEmails.length})</span>
        </button>

        <button
          id="tab-PHOTOS"
          role="tab"
          aria-selected={activeTab === "PHOTOS"}
          aria-controls="tabpanel-PHOTOS"
          onClick={() => onTabChange("PHOTOS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            activeTab === "PHOTOS"
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <ImageIcon className="w-4 h-4" aria-hidden="true" />
          <span>Fotos Duplicadas ({duplicateGroups.length})</span>
        </button>

        <button
          id="tab-DRIVE_FILES"
          role="tab"
          aria-selected={activeTab === "DRIVE_FILES"}
          aria-controls="tabpanel-DRIVE_FILES"
          onClick={() => onTabChange("DRIVE_FILES")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            activeTab === "DRIVE_FILES"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <HardDrive className="w-4 h-4" aria-hidden="true" />
          <span>Drive Obsoleto ({oldDriveFiles.length})</span>
        </button>

        <button
          id="tab-TRASH"
          role="tab"
          aria-selected={activeTab === "TRASH"}
          aria-controls="tabpanel-TRASH"
          onClick={() => onTabChange("TRASH")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            activeTab === "TRASH"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
              : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
          <span>Papelera ({trashItems.length})</span>
        </button>
      </div>

      {/* Content Area */}
      {/* 1. HEAVY EMAILS TAB */}
      {activeTab === "EMAILS" && (
        <div
          id="tabpanel-EMAILS"
          role="tabpanel"
          aria-labelledby="tab-EMAILS"
          tabIndex={0}
          className="space-y-4 focus:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAllEmails}
                aria-label={
                  selectedEmailIds.length === heavyEmails.length
                    ? "Desmarcar todos los correos pesados"
                    : "Seleccionar todos los correos pesados"
                }
                aria-checked={selectedEmailIds.length === heavyEmails.length}
                role="checkbox"
                className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded p-1"
              >
                {selectedEmailIds.length === heavyEmails.length ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" aria-hidden="true" />
                )}
                <span>
                  Seleccionar Todo ({selectedEmailIds.length}/{heavyEmails.length})
                </span>
              </button>

              <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
                Espacio liberable seleccionado:{" "}
                <strong className="text-indigo-400 font-mono font-bold">
                  {selectedEmailSpaceGb} GB
                </strong>
              </span>
            </div>

            <button
              onClick={() => {
                onDeleteEmails(selectedEmailIds);
                setSelectedEmailIds([]);
              }}
              disabled={selectedEmailIds.length === 0}
              aria-label={`Eliminar ${selectedEmailIds.length} correos pesados seleccionados para liberar ${selectedEmailSpaceGb} gigabytes`}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Trash className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Eliminar {selectedEmailIds.length} Correos</span>
            </button>
          </div>

          <div
            role="group"
            aria-label="Lista de correos electrónicos pesados"
            className="space-y-2"
          >
            {heavyEmails.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No hay correos pesados pendientes de limpieza.
              </p>
            ) : (
              heavyEmails.map((email) => {
                const isSelected = selectedEmailIds.includes(email.id);
                return (
                  <div
                    key={email.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    aria-label={`Correo: ${email.subject}, de ${email.sender}, tamaño ${email.sizeMb.toFixed(1)} megabytes. ${isSelected ? "Seleccionado" : "No seleccionado"}`}
                    onClick={() => toggleSelectEmail(email.id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggleSelectEmail(email.id);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
                      )}
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {email.subject}
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-slate-300">
                            {email.attachmentType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          De: {email.sender} • {email.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-indigo-300 block">
                        {email.sizeMb.toFixed(1)} MB
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {email.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. DUPLICATE PHOTOS TAB */}
      {activeTab === "PHOTOS" && (
        <div
          id="tabpanel-PHOTOS"
          role="tabpanel"
          aria-labelledby="tab-PHOTOS"
          tabIndex={0}
          className="space-y-4 focus:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                <span>Algoritmo de IA "Best Shot Selector"</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Selecciona automáticamente la foto con mejor enfoque y resolución, marcando el resto para borrado.
              </p>
            </div>

            <button
              onClick={() => {
                onDeleteDuplicatePhotos(selectedGroupIds);
              }}
              disabled={selectedGroupIds.length === 0}
              aria-label={`Conservar solo la mejor toma de los grupos seleccionados para ahorrar aproximadamente ${selectedDuplicateSpaceGb} gigabytes`}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Trash className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Conservar Solo La Mejor Toma (~{selectedDuplicateSpaceGb} GB)</span>
            </button>
          </div>

          <div
            role="group"
            aria-label="Grupos de fotos duplicadas"
            className="space-y-4"
          >
            {duplicateGroups.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No hay grupos de fotos duplicadas detectados.
              </p>
            ) : (
              duplicateGroups.map((group) => {
                const isGroupSelected = selectedGroupIds.includes(group.id);
                return (
                  <div
                    key={group.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`checkbox-group-${group.id}`}
                          checked={isGroupSelected}
                          onChange={() => toggleSelectGroup(group.id)}
                          aria-label={`Seleccionar grupo de duplicados: ${group.title}, coincidencia ${group.similarityScore}%`}
                          className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 focus:ring-offset-slate-950 cursor-pointer"
                        />
                        <label
                          htmlFor={`checkbox-group-${group.id}`}
                          className="cursor-pointer"
                        >
                          <h5 className="text-xs font-bold text-white">{group.title}</h5>
                          <p className="text-[10px] text-slate-400">
                            {group.location} • Coincidencia visual:{" "}
                            <strong className="text-cyan-400 font-mono">{group.similarityScore}%</strong>
                          </p>
                        </label>
                      </div>

                      <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        Ahorro: ~{group.potentialSavedMb.toFixed(1)} MB
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {group.photos.map((photo) => (
                        <div
                          key={photo.id}
                          tabIndex={0}
                          aria-label={`Foto ${photo.filename}, resolución ${photo.resolution}, peso ${photo.sizeMb} MB. ${
                            photo.isBestQuality
                              ? "Evaluada como la de mejor calidad para conservar"
                              : "Marcada para eliminación"
                          }`}
                          className={`relative rounded-lg overflow-hidden border transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                            photo.isBestQuality
                              ? "border-emerald-500/80 shadow-md shadow-emerald-500/10"
                              : "border-slate-800 opacity-75 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt={`Vista previa de ${photo.filename}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="p-2 bg-slate-950 text-[10px] space-y-0.5">
                            <p className="font-mono text-slate-300 truncate">{photo.filename}</p>
                            <p className="text-slate-400">{photo.resolution}</p>
                            <p className="text-slate-500">{photo.sizeMb} MB</p>
                          </div>

                          {photo.isBestQuality ? (
                            <span className="absolute top-1 right-1 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" aria-hidden="true" /> MEJOR
                            </span>
                          ) : (
                            <span className="absolute top-1 right-1 bg-red-500/80 text-white font-semibold text-[9px] px-1.5 py-0.5 rounded shadow">
                              ELIMINAR
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. OLD DRIVE FILES TAB */}
      {activeTab === "DRIVE_FILES" && (
        <div
          id="tabpanel-DRIVE_FILES"
          role="tabpanel"
          aria-labelledby="tab-DRIVE_FILES"
          tabIndex={0}
          className="space-y-4 focus:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAllDrive}
                aria-label={
                  selectedDriveIds.length === oldDriveFiles.length
                    ? "Desmarcar todos los archivos obsoletos de Drive"
                    : "Seleccionar todos los archivos obsoletos de Drive"
                }
                aria-checked={selectedDriveIds.length === oldDriveFiles.length}
                role="checkbox"
                className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 rounded p-1"
              >
                {selectedDriveIds.length === oldDriveFiles.length ? (
                  <CheckSquare className="w-4 h-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" aria-hidden="true" />
                )}
                <span>
                  Seleccionar Todo ({selectedDriveIds.length}/{oldDriveFiles.length})
                </span>
              </button>

              <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
                Espacio liberable:{" "}
                <strong className="text-amber-400 font-mono font-bold">
                  {selectedDriveSpaceGb} GB
                </strong>
              </span>
            </div>

            <button
              onClick={() => {
                onDeleteOldDriveFiles(selectedDriveIds);
                setSelectedDriveIds([]);
              }}
              disabled={selectedDriveIds.length === 0}
              aria-label={`Archivar o borrar ${selectedDriveIds.length} archivos obsoletos de Drive seleccionados para liberar ${selectedDriveSpaceGb} gigabytes`}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Trash className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Archivar/Borrar {selectedDriveIds.length} Archivos</span>
            </button>
          </div>

          <div
            role="group"
            aria-label="Lista de archivos obsoletos de Google Drive"
            className="space-y-2"
          >
            {oldDriveFiles.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No hay archivos obsoletos en Google Drive.
              </p>
            ) : (
              oldDriveFiles.map((file) => {
                const isSelected = selectedDriveIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    aria-label={`Archivo de Drive: ${file.name}, formato ${file.fileType}, peso ${(file.sizeMb / 1024).toFixed(2)} GB, modificado hace ${file.daysUnmodified} días. ${isSelected ? "Seleccionado" : "No seleccionado"}`}
                    onClick={() => toggleSelectDrive(file.id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggleSelectDrive(file.id);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                      isSelected
                        ? "bg-amber-950/30 border-amber-500/50"
                        : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amber-400 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
                      )}

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {file.name}
                          </span>
                          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-slate-800 text-amber-300">
                            {file.fileType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          Ubicación: {file.path} • Modificado hace {file.daysUnmodified} días ({file.lastModified})
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400 block">
                        {(file.sizeMb / 1024).toFixed(2)} GB
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        Sin uso desde 2022
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. TRASH TAB */}
      {activeTab === "TRASH" && (
        <div
          id="tabpanel-TRASH"
          role="tabpanel"
          aria-labelledby="tab-TRASH"
          tabIndex={0}
          className="space-y-4 focus:outline-none"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl">
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Limpieza de Papeleras y Caché del Sistema</span>
              </h4>
              <p className="text-[11px] text-slate-400">
                Los elementos en la papelera continúan ocupando espacio en tu cuota de almacenamiento.
              </p>
            </div>

            <button
              onClick={() => {
                onPurgeTrashItems(selectedTrashIds);
                setSelectedTrashIds([]);
              }}
              disabled={selectedTrashIds.length === 0}
              aria-label={`Vaciar papeleras seleccionadas para recuperar aproximadamente ${selectedTrashSpaceGb} gigabytes`}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <Trash className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Vaciar Papeleras (~{selectedTrashSpaceGb} GB)</span>
            </button>
          </div>

          <div
            role="group"
            aria-label="Orígenes de elementos en papelera"
            className="grid grid-cols-1 md:grid-cols-3 gap-3"
          >
            {trashItems.map((item) => {
              const isSelected = selectedTrashIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  role="checkbox"
                  aria-checked={isSelected}
                  tabIndex={0}
                  aria-label={`Papelera de ${item.source}: ${item.sizeGb} GB, ${item.itemCount} elementos. ${isSelected ? "Seleccionado" : "No seleccionado"}`}
                  onClick={() => toggleSelectTrash(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      toggleSelectTrash(item.id);
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-slate-950 ${
                    isSelected
                      ? "bg-emerald-950/30 border-emerald-500/50"
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{item.source}</span>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" aria-hidden="true" />
                    )}
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {item.sizeGb} GB
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {item.itemCount} elementos
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-500">
                    Antigüedad media en papelera: {item.daysInTrash} días
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
