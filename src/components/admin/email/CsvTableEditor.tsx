"use client";

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  Download,
  AlertCircle
} from "lucide-react";
import { ParsedCsvResult, unparseCsv } from "@/lib/email/csvParser";

interface CsvTableEditorProps {
  data: ParsedCsvResult;
  selectedEmailCol: string;
  onSelectEmailCol: (col: string) => void;
  onChangeData: (updated: ParsedCsvResult, csvText: string) => void;
}

export function CsvTableEditor({
  data,
  selectedEmailCol,
  onSelectEmailCol,
  onChangeData
}: CsvTableEditorProps) {
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(null);
  const [tempHeaderName, setTempHeaderName] = useState<string>("");

  const [newColName, setNewColName] = useState<string>("");
  const [showAddColInput, setShowAddColInput] = useState<boolean>(false);

  const { headers, rows } = data;

  const updateStateAndEmit = (newHeaders: string[], newRows: Record<string, string>[]) => {
    // Se la colonna email selezionata non esiste più, aggiorna la selezione
    let newEmailCol = selectedEmailCol;
    if (!newHeaders.includes(newEmailCol)) {
      newEmailCol = newHeaders[0] || "";
      onSelectEmailCol(newEmailCol);
    }

    const updatedResult: ParsedCsvResult = {
      ...data,
      headers: newHeaders,
      rows: newRows,
      totalRows: newRows.length,
      detectedEmailField: newHeaders.includes(data.detectedEmailField || "")
        ? data.detectedEmailField
        : newHeaders[0] || null
    };

    const newCsvString = unparseCsv(newHeaders, newRows);
    onChangeData(updatedResult, newCsvString);
  };

  // Modifica valore cella
  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = {
      ...newRows[rowIndex],
      [header]: value
    };
    updateStateAndEmit(headers, newRows);
  };

  // Aggiungi nuova riga
  const handleAddRow = () => {
    const emptyRow: Record<string, string> = {};
    headers.forEach((h) => {
      emptyRow[h] = "";
    });
    const newRows = [...rows, emptyRow];
    updateStateAndEmit(headers, newRows);
  };

  // Rimuovi riga
  const handleDeleteRow = (rowIndex: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    updateStateAndEmit(headers, newRows);
  };

  // Aggiungi nuova colonna
  const handleAddColumn = () => {
    const trimmed = newColName.trim();
    if (!trimmed) return;
    if (headers.includes(trimmed)) {
      alert("Esiste già una colonna con questo nome.");
      return;
    }

    const newHeaders = [...headers, trimmed];
    const newRows = rows.map((r) => ({
      ...r,
      [trimmed]: ""
    }));

    setNewColName("");
    setShowAddColInput(false);
    updateStateAndEmit(newHeaders, newRows);
  };

  // Rinomina colonna esistente
  const handleSaveHeaderRename = (index: number) => {
    const oldName = headers[index];
    const trimmed = tempHeaderName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingHeaderIndex(null);
      return;
    }

    if (headers.some((h, i) => i !== index && h.toLowerCase() === trimmed.toLowerCase())) {
      alert("Esiste già una colonna con questo nome.");
      return;
    }

    const newHeaders = [...headers];
    newHeaders[index] = trimmed;

    // Riorganizza chiavi in ogni riga
    const newRows = rows.map((row) => {
      const updatedRow: Record<string, string> = {};
      for (const h of headers) {
        if (h === oldName) {
          updatedRow[trimmed] = row[oldName] || "";
        } else {
          updatedRow[h] = row[h] || "";
        }
      }
      return updatedRow;
    });

    if (selectedEmailCol === oldName) {
      onSelectEmailCol(trimmed);
    }

    setEditingHeaderIndex(null);
    updateStateAndEmit(newHeaders, newRows);
  };

  // Elimina colonna
  const handleDeleteColumn = (headerToDelete: string) => {
    if (headers.length <= 1) {
      alert("Deve rimanere almeno una colonna nel foglio.");
      return;
    }
    if (!confirm(`Sei sicuro di voler eliminare la colonna "${headerToDelete}" e tutti i suoi dati?`)) {
      return;
    }

    const newHeaders = headers.filter((h) => h !== headerToDelete);
    const newRows = rows.map((row) => {
      const copy = { ...row };
      delete copy[headerToDelete];
      return copy;
    });

    if (selectedEmailCol === headerToDelete) {
      onSelectEmailCol(newHeaders[0] || "");
    }

    updateStateAndEmit(newHeaders, newRows);
  };

  // Scarica CSV modificato
  const handleDownloadCsv = () => {
    const csvContent = unparseCsv(headers, rows);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "destinatari_modificato.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Barra Azioni Tabella */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-background/50 border border-foreground/10">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-foreground block">
              Editor Dati Tabellari
            </span>
            <span className="text-[11px] text-foreground/50">
              {rows.length} righe • {headers.length} colonne
            </span>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {showAddColInput ? (
            <div className="flex items-center gap-1.5 bg-background border border-foreground/20 rounded-xl p-1 shadow-sm">
              <input
                type="text"
                placeholder="Nome colonna..."
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                  if (e.key === "Escape") setShowAddColInput(false);
                }}
                className="px-2 py-1 text-xs bg-transparent text-foreground focus:outline-none w-32"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddColumn}
                className="p-1 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all cursor-pointer"
                title="Aggiungi"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddColInput(false)}
                className="p-1 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all cursor-pointer"
                title="Annulla"
              >
                <X size={13} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowAddColInput(true);
                setNewColName("");
              }}
              className="px-3 py-1.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>Nuova Colonna</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={13} />
            <span>Nuova Riga</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/70 hover:text-foreground text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-foreground/10"
            title="Scarica CSV modificato"
          >
            <Download size={13} />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>

      {/* Tabella con scrolling orizzontale e verticale */}
      <div className="border border-foreground/10 rounded-2xl overflow-hidden bg-background/40 backdrop-blur-sm">
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-md border-b border-foreground/10 text-foreground/80 select-none">
              <tr>
                <th className="p-2.5 w-10 text-center font-bold text-foreground/40 text-[10px] uppercase">
                  #
                </th>
                {headers.map((header, idx) => {
                  const isEmailCol = header === selectedEmailCol;
                  const isEditing = editingHeaderIndex === idx;

                  return (
                    <th
                      key={header + "_" + idx}
                      className={`p-2 font-bold min-w-[150px] border-r border-foreground/5 transition-colors ${
                        isEmailCol ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempHeaderName}
                            onChange={(e) => setTempHeaderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveHeaderRename(idx);
                              if (e.key === "Escape") setEditingHeaderIndex(null);
                            }}
                            className="w-full px-2 py-0.5 rounded bg-background border border-primary text-xs font-bold text-foreground focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveHeaderRename(idx)}
                            className="p-1 rounded hover:bg-primary/20 text-primary"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingHeaderIndex(null)}
                            className="p-1 rounded hover:bg-foreground/10 text-foreground/50"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 group">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="truncate font-black uppercase text-[11px] tracking-wider">
                              {header}
                            </span>
                            {isEmailCol && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                                Email
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingHeaderIndex(idx);
                                setTempHeaderName(header);
                              }}
                              className="p-1 rounded hover:bg-foreground/10 text-foreground/60 hover:text-foreground cursor-pointer"
                              title="Rinomina colonna"
                            >
                              <Edit2 size={11} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(header)}
                              className="p-1 rounded hover:bg-rose-500/20 text-foreground/40 hover:text-rose-400 cursor-pointer"
                              title="Elimina colonna"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )}
                    </th>
                  );
                })}
                <th className="p-2.5 w-12 text-center font-bold text-foreground/40 text-[10px] uppercase">
                  Azioni
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-foreground/5">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length + 2}
                    className="p-8 text-center text-foreground/40 italic"
                  >
                    Nessuna riga presente. Clicca &quot;Nuova Riga&quot; per iniziare.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-foreground/[0.02] transition-colors group"
                  >
                    <td className="p-2 text-center text-[10px] font-mono text-foreground/40 select-none">
                      {rIdx + 1}
                    </td>

                    {headers.map((header) => {
                      const isEmailCol = header === selectedEmailCol;
                      const val = row[header] ?? "";
                      const isInvalidEmail =
                        isEmailCol && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

                      return (
                        <td
                          key={header}
                          className={`p-1 border-r border-foreground/5 ${
                            isEmailCol ? "bg-primary/[0.02]" : ""
                          }`}
                        >
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => handleCellChange(rIdx, header, e.target.value)}
                              className={`w-full px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-background/80 focus:bg-background border border-transparent hover:border-foreground/10 focus:border-primary text-xs text-foreground focus:outline-none transition-all ${
                                isInvalidEmail ? "border-amber-500/50 text-amber-300" : ""
                              }`}
                            />
                            {isInvalidEmail && (
                              <div
                                className="absolute right-2 text-amber-400 pointer-events-none"
                                title="Formato email non valido"
                              >
                                <AlertCircle size={12} />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-rose-500/10 text-rose-400 transition-all cursor-pointer"
                        title="Elimina riga"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

