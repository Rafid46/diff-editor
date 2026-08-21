"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { FileCode, AlertCircle } from "lucide-react";
import {
  FileDiffItem,
  DiffMode,
  DiffHunkBlock,
  AntigravityViewMode,
} from "@/types/diff";
import { parseHunks } from "@/lib/diff-calculator";
import { getLanguageFromPath } from "@/lib/utils";
import { FileHeader } from "./FileHeader";
import { AntigravityDiffViewer } from "./AntigravityDiffViewer";

const MonacoDiffEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full text-xs text-[var(--foreground)]/40 bg-[var(--background)]">
        Loading diff editor...
      </div>
    ),
  },
);

interface DiffViewerProps {
  item: FileDiffItem | null;
  mode: DiffMode;
  onChangeMode: (mode: DiffMode) => void;
  inlineDiff: boolean;
  onToggleInlineDiff: () => void;
  onAccept: (path: string) => void;
  onReject: (path: string) => void;
  onUndo?: (path: string) => void;
  lastAction?: 'accept' | 'reject' | null;
  hunkActions?: Record<string, 'accept' | 'reject'>;
  onAcceptHunk: (path: string, hunk: DiffHunkBlock) => void;
  onRejectHunk: (path: string, hunk: DiffHunkBlock) => void;
  onUndoHunk?: (path: string, hunk: DiffHunkBlock) => void;
}

export function DiffViewer({
  item,
  mode,
  onChangeMode,
  inlineDiff,
  onToggleInlineDiff,
  onAccept,
  onReject,
  onUndo,
  lastAction,
  hunkActions = {},
  onAcceptHunk,
  onRejectHunk,
  onUndoHunk,
}: DiffViewerProps) {
  const [antigravityView, setAntigravityView] =
    useState<AntigravityViewMode>("component");

  const hunkCount = useMemo(() => {
    if (!item) return 0;
    if (item.status === 'added' || item.status === 'deleted') return 1;
    return parseHunks(item.originalContent, item.currentContent).length;
  }, [item]);

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]/50 p-6 text-center select-none transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-[var(--border)] flex items-center justify-center mb-4 shadow-inner">
          <FileCode className="w-7 h-7 text-[var(--foreground)]/40" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
          No File Selected
        </h3>
        <p className="text-xs text-[var(--foreground)]/40">
          Select a modified file from the sidebar to review changes.
        </p>
      </div>
    );
  }

  if (item.isBinary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]/50 p-6 text-center select-none transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-1">
          Binary File
        </h3>
        <p className="text-xs text-[var(--foreground)]/40">
          Diff is not supported for binary file types ({item.name}).
        </p>
      </div>
    );
  }

  const language = getLanguageFromPath(item.path);

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] overflow-hidden transition-colors">
      <FileHeader
        path={item.path}
        additions={item.additions}
        deletions={item.deletions}
        mode={mode}
        onChangeMode={onChangeMode}
        inlineDiff={inlineDiff}
        onToggleInlineDiff={onToggleInlineDiff}
        antigravityView={antigravityView}
        onToggleAntigravityView={() =>
          setAntigravityView((prev) =>
            prev === "component" ? "blocks" : "component",
          )
        }
        onAccept={() => onAccept(item.path)}
        onReject={() => onReject(item.path)}
        onUndo={onUndo ? () => onUndo(item.path) : undefined}
        lastAction={lastAction}
        blockCount={hunkCount}
      />

      <div className="flex-1 w-full h-[calc(100%-68px)] overflow-hidden">
        {mode === "github" ? (
          <MonacoDiffEditor
            height="100%"
            language={language}
            original={item.originalContent}
            modified={item.currentContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              renderSideBySide: !inlineDiff,
              fontSize: 13,
              lineNumbers: "on",
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "off",
              diffCodeLens: false,
              renderIndicators: true,
            }}
          />
        ) : (
          <AntigravityDiffViewer
            item={item}
            viewMode={antigravityView}
            hunkActions={hunkActions}
            onAcceptHunk={(hunk) => onAcceptHunk(item.path, hunk)}
            onRejectHunk={(hunk) => onRejectHunk(item.path, hunk)}
            onUndoHunk={onUndoHunk ? (hunk) => onUndoHunk(item.path, hunk) : undefined}
          />
        )}
      </div>
    </div>
  );
}
