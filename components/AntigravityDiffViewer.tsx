"use client";

import React, { useMemo, useRef } from "react";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import { FileDiffItem, DiffHunkBlock, AntigravityViewMode } from "@/types/diff";
import { parseHunks, parseFullComponentCode } from "@/lib/diff-calculator";
import { highlightCode } from "@/lib/syntax-highlighter";
import { getLanguageFromPath } from "@/lib/utils";

interface AntigravityDiffViewerProps {
  item: FileDiffItem;
  viewMode?: AntigravityViewMode;
  hunkActions?: Record<string, 'accept' | 'reject'>;
  onAcceptHunk: (hunk: DiffHunkBlock) => void;
  onRejectHunk: (hunk: DiffHunkBlock) => void;
  onUndoHunk?: (hunk: DiffHunkBlock) => void;
}

export function AntigravityDiffViewer({
  item,
  viewMode = "component",
  hunkActions = {},
  onAcceptHunk,
  onRejectHunk,
  onUndoHunk,
}: AntigravityDiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const language = useMemo(() => getLanguageFromPath(item.path), [item.path]);

  const fullCodeItems = useMemo(() => {
    return parseFullComponentCode(
      item.originalContent,
      item.currentContent,
    );
  }, [item.originalContent, item.currentContent]);

  const hunks = useMemo(() => {
    if (item.status === "added") {
      const lines = item.currentContent.split("\n");
      const block: DiffHunkBlock = {
        id: "hunk-0",
        oldStart: 0,
        oldLines: 0,
        newStart: 1,
        newLines: lines.length,
        lines: lines.map((line, idx) => ({
          type: "add" as const,
          content: line,
          newLineNumber: idx + 1,
        })),
        oldChunkText: "",
        newChunkText: item.currentContent,
      };
      return [block];
    }
    if (item.status === "deleted") {
      const lines = item.originalContent.split("\n");
      const block: DiffHunkBlock = {
        id: "hunk-0",
        oldStart: 1,
        oldLines: lines.length,
        newStart: 0,
        newLines: 0,
        lines: lines.map((line, idx) => ({
          type: "delete" as const,
          content: line,
          oldLineNumber: idx + 1,
        })),
        oldChunkText: item.originalContent,
        newChunkText: "",
      };
      return [block];
    }
    return parseHunks(item.originalContent, item.currentContent);
  }, [item.originalContent, item.currentContent, item.status]);

  const changeMarkers = useMemo(() => {
    if (fullCodeItems.length === 0) return [];
    const markers: Array<{
      id: string;
      topPercent: number;
      heightPercent: number;
      type: "add" | "delete" | "mixed";
      blockIndex: number;
    }> = [];

    let currentLineIndex = 0;
    const totalLines = fullCodeItems.reduce(
      (acc, cur) => acc + (cur.type === "hunk" ? cur.hunk.lines.length : 1),
      0,
    );

    for (let i = 0; i < fullCodeItems.length; i++) {
      const entry = fullCodeItems[i];
      if (entry.type === "normal") {
        currentLineIndex++;
      } else {
        const hunkLinesCount = entry.hunk.lines.length;
        const topPercent = (currentLineIndex / Math.max(1, totalLines)) * 100;
        const heightPercent = Math.max(
          1.5,
          (hunkLinesCount / Math.max(1, totalLines)) * 100,
        );
        const hasAdd = entry.hunk.lines.some((l) => l.type === "add");
        const hasDelete = entry.hunk.lines.some((l) => l.type === "delete");
        const type = hasAdd && hasDelete ? "mixed" : hasAdd ? "add" : "delete";

        markers.push({
          id: entry.hunk.id,
          topPercent,
          heightPercent,
          type,
          blockIndex: entry.blockIndex,
        });
        currentLineIndex += hunkLinesCount;
      }
    }
    return markers;
  }, [fullCodeItems]);

  const scrollToBlock = (blockIndex: number) => {
    const el = document.getElementById(`hunk-anchor-${blockIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (viewMode === "component") {
    return (
      <div className="flex-1 flex relative h-full bg-[var(--background)] overflow-hidden font-mono text-xs select-text">
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-auto divide-y divide-[var(--border-subtle)] pr-4"
        >
          {fullCodeItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
              <p>Empty file.</p>
            </div>
          ) : (
            fullCodeItems.map((entry, entryIdx) => {
              if (entry.type === "normal") {
                return (
                  <div
                    key={`norm-${entryIdx}`}
                    className="flex items-stretch hover:bg-white/[0.02] transition-colors duration-150 border-l-2 border-l-transparent text-white/70"
                  >
                    <div className="w-12 py-0.5 px-2 text-right text-[11px] text-white/50 select-none shrink-0 border-r border-[var(--border)]">
                      {entry.oldLineNumber}
                    </div>
                    <div className="w-12 py-0.5 px-2 text-right text-[11px] text-white/50 select-none shrink-0 border-r border-[var(--border)]">
                      {entry.newLineNumber}
                    </div>
                    <div className="w-6 py-0.5 text-center text-white/20 select-none shrink-0" />
                    <div className="py-0.5 px-3 whitespace-pre overflow-x-auto flex-1 leading-relaxed text-white/70">
                      {highlightCode(entry.content, language)}
                    </div>
                  </div>
                );
              }

              const hunk = entry.hunk;
              const action = hunkActions[hunk.id];

              return (
                <React.Fragment key={`hunk-${entry.blockIndex}`}>
                  <div
                    id={`hunk-anchor-${entry.blockIndex}`}
                    className="flex items-center justify-end px-3 py-1 bg-[var(--panel)] border-y border-[var(--border)] sticky top-0 z-10 select-none shadow-sm transition-all duration-300"
                  >
                    {action && onUndoHunk ? (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <span className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                          action === 'accept' ? 'text-[#7EC151]' : 'text-[#AA1C41]'
                        }`}>
                          {action === 'accept' ? (
                            <>
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>Accepted</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                              <span>Rejected</span>
                            </>
                          )}
                        </span>
                        <button
                          onClick={() => onUndoHunk(hunk)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-white/[0.1] hover:bg-white/[0.18] active:scale-95 border border-white/20 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                          title="Undo this action"
                        >
                          <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Undo</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 animate-fade-in">
                        <button
                          onClick={() => onAcceptHunk(hunk)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#7EC151] hover:text-black bg-[#7EC151]/15 hover:bg-[#7EC151] active:scale-95 border border-[#7EC151]/30 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                          title="Accept this change block"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => onRejectHunk(hunk)}
                          className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#AA1C41] hover:text-white bg-[#AA1C41]/15 hover:bg-[#AA1C41] active:scale-95 border border-[#AA1C41]/30 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                          title="Reject and revert this change block"
                        >
                          <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {hunk.lines.map((line, lineIdx) => {
                    const isAdd = line.type === "add";
                    const isDelete = line.type === "delete";

                    return (
                      <div
                        key={`hunk-line-${entry.blockIndex}-${lineIdx}`}
                        className={`flex items-stretch transition-all duration-200 ${
                          isAdd
                            ? "animate-diff-add bg-[#7EC151]/10 border-l-2 border-l-[#7EC151] border-r-4 border-r-[#7EC151]"
                            : isDelete
                              ? "animate-diff-delete bg-[#AA1C41]/10 border-l-2 border-l-[#AA1C41] border-r-4 border-r-[#AA1C41]"
                              : "hover:bg-white/[0.02] border-l-2 border-l-transparent text-white/70"
                        }`}
                      >
                        <div className="w-12 py-0.5 px-2 text-right text-[11px] text-white/50 select-none shrink-0 border-r border-[var(--border)]">
                          {line.oldLineNumber ?? ""}
                        </div>
                        <div className="w-12 py-0.5 px-2 text-right text-[11px] text-white/50 select-none shrink-0 border-r border-[var(--border)]">
                          {line.newLineNumber ?? ""}
                        </div>
                        <div
                          className={`w-6 py-0.5 text-center font-bold select-none shrink-0 transition-colors ${
                            isAdd
                              ? "text-[#7EC151]"
                              : isDelete
                                ? "text-[#AA1C41]"
                                : "text-white/20"
                          }`}
                        >
                          {isAdd ? "+" : isDelete ? "-" : " "}
                        </div>
                        <div className="py-0.5 px-3 whitespace-pre overflow-x-auto flex-1 leading-relaxed text-white/70">
                          {highlightCode(line.content, language)}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })
          )}
        </div>

        {changeMarkers.length > 0 && (
          <div className="w-3 h-full absolute right-0 top-0 bg-black/20 border-l border-[var(--border)] z-20 pointer-events-auto select-none transition-all duration-300">
            {changeMarkers.map((m) => (
              <button
                key={m.id}
                onClick={() => scrollToBlock(m.blockIndex)}
                style={{
                  top: `${m.topPercent}%`,
                  height: `${m.heightPercent}%`,
                  minHeight: "6px",
                }}
                className={`absolute w-full rounded-sm transition-all duration-200 cursor-pointer hover:opacity-100 hover:scale-x-125 ${
                  m.type === "delete"
                    ? "bg-[#AA1C41] shadow-[0_0_6px_rgba(170,28,65,0.8)] opacity-90"
                    : "bg-[#7EC151] shadow-[0_0_6px_rgba(126,193,81,0.8)] opacity-90"
                }`}
                title="Click to jump to change"
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex relative h-full bg-[var(--background)] overflow-hidden font-mono text-xs select-text">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 pr-6"
      >
        {hunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-fade-in">
            <p>No difference found for this file.</p>
          </div>
        ) : (
          hunks.map((hunk, index) => {
            const action = hunkActions[hunk.id];

            return (
              <div
                key={hunk.id}
                id={`hunk-anchor-${index}`}
                className="bg-[var(--panel)]/90 backdrop-blur-md border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl"
              >
                <div className="bg-black/40 border-b border-[var(--border)] px-3.5 py-2.5 flex items-center justify-end transition-all">
                  {action && onUndoHunk ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <span className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                        action === 'accept' ? 'text-[#7EC151]' : 'text-[#AA1C41]'
                      }`}>
                        {action === 'accept' ? (
                          <>
                            <Check className="w-3 h-3 stroke-[2.5]" />
                            <span>Accepted</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 stroke-[2.5]" />
                            <span>Rejected</span>
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => onUndoHunk(hunk)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-white/[0.1] hover:bg-white/[0.18] active:scale-95 border border-white/20 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                        title="Undo this action"
                      >
                        <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Undo</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <button
                        onClick={() => onAcceptHunk(hunk)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#7EC151] hover:text-black bg-[#7EC151]/15 hover:bg-[#7EC151] active:scale-95 border border-[#7EC151]/30 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                        title="Accept this change block"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Accept</span>
                      </button>

                      <button
                        onClick={() => onRejectHunk(hunk)}
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[#AA1C41] hover:text-white bg-[#AA1C41]/15 hover:bg-[#AA1C41] active:scale-95 border border-[#AA1C41]/30 rounded-xl transition-all duration-150 cursor-pointer shadow-sm"
                        title="Reject and revert this change block"
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto divide-y divide-white/[0.04]">
                  {hunk.lines.map((line, lineIdx) => {
                    const isAdd = line.type === "add";
                    const isDelete = line.type === "delete";

                    return (
                      <div
                        key={lineIdx}
                        className={`flex items-stretch transition-all duration-200 ${
                          isAdd
                            ? "animate-diff-add bg-[#7EC151]/10 border-l-2 border-l-[#7EC151] border-r-4 border-r-[#7EC151]"
                            : isDelete
                              ? "animate-diff-delete bg-[#AA1C41]/10 border-l-2 border-l-[#AA1C41] border-r-4 border-r-[#AA1C41]"
                              : "hover:bg-white/[0.02] border-l-2 border-l-transparent text-white/70"
                        }`}
                      >
                        <div className="w-12 py-0.5 px-2 text-right text-[11px] text-white/50 select-none shrink-0 border-r border-[var(--border)]">
                          {line.oldLineNumber ?? ""}
                        </div>
                        <div className="w-12 py-0.5 px-2 text-right text-[11px] text-white/50 select-none shrink-0 border-r border-[var(--border)]">
                          {line.newLineNumber ?? ""}
                        </div>
                        <div
                          className={`w-6 py-0.5 text-center font-bold select-none shrink-0 transition-colors ${
                            isAdd
                              ? "text-[#7EC151]"
                              : isDelete
                                ? "text-[#AA1C41]"
                                : "text-white/20"
                          }`}
                        >
                          {isAdd ? "+" : isDelete ? "-" : " "}
                        </div>
                        <div className="py-0.5 px-3 whitespace-pre overflow-x-auto flex-1 leading-relaxed text-white/70">
                          {highlightCode(line.content, language)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {changeMarkers.length > 0 && (
        <div className="w-3 h-full absolute right-0 top-0 bg-black/20 border-l border-[var(--border)] z-20 pointer-events-auto select-none transition-all duration-300">
          {changeMarkers.map((m) => (
            <button
              key={m.id}
              onClick={() => scrollToBlock(m.blockIndex)}
              style={{
                top: `${m.topPercent}%`,
                height: `${m.heightPercent}%`,
                minHeight: "6px",
              }}
              className={`absolute w-full rounded-sm transition-all duration-200 cursor-pointer hover:opacity-100 hover:scale-x-125 ${
                m.type === "delete"
                  ? "bg-[#AA1C41] shadow-[0_0_6px_rgba(170,28,65,0.8)] opacity-90"
                  : "bg-[#7EC151] shadow-[0_0_6px_rgba(126,193,81,0.8)] opacity-90"
              }`}
              title="Click to jump to change"
            />
          ))}
        </div>
      )}
    </div>
  );
}
