import React from "react";
import {
  Check,
  RotateCcw,
  Columns,
  AlignJustify,
  CheckCheck,
  Code2,
  Undo2,
  Minus,
  Plus,
} from "lucide-react";
import { DiffMode, AntigravityViewMode } from "@/types/diff";

interface FileHeaderProps {
  path: string;
  additions: number;
  deletions: number;
  mode: DiffMode;
  inlineDiff: boolean;
  onToggleInlineDiff: () => void;
  antigravityView?: AntigravityViewMode;
  onToggleAntigravityView?: () => void;
  fontSize: number;
  onIncreaseFontSize: () => void;
  onDecreaseFontSize: () => void;
  onAccept: () => void;
  onReject: () => void;
  onUndo?: () => void;
  lastAction?: "accept" | "reject" | null;
  blockCount?: number;
}

export function FileHeader({
  path,
  additions,
  deletions,
  mode,
  inlineDiff,
  onToggleInlineDiff,
  antigravityView = "component",
  onToggleAntigravityView,
  fontSize,
  onIncreaseFontSize,
  onDecreaseFontSize,
  onAccept,
  onReject,
  onUndo,
  lastAction,
  blockCount,
}: FileHeaderProps) {
  return (
    <div className="h-[68px] bg-[var(--panel)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 flex items-center justify-between shrink-0 select-none z-10 transition-colors">
      <div className="flex items-center gap-3 min-w-0 pr-4">
        <span className="text-xs font-mono font-medium text-[var(--foreground)] truncate max-w-xl">
          {path}
        </span>
        <div className="flex items-center gap-1.5 text-xs font-mono shrink-0">
          {additions > 0 && (
            <span className="text-[#7EC151] font-semibold">+{additions}</span>
          )}
          {deletions > 0 && (
            <span className="text-[#AA1C41] font-semibold">-{deletions}</span>
          )}
        </div>
        {mode === "antigravity" && typeof blockCount === "number" && (
          <span className="text-[11px] font-mono text-[var(--foreground)]/60 bg-white/[0.04] border border-[var(--border)] px-2 py-0.5 rounded-full shrink-0">
            {blockCount} {blockCount === 1 ? "block" : "blocks"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">

        <div className="flex items-center bg-black/40 border border-[var(--border)] rounded-xl p-1 backdrop-blur-md h-[38px]">
          <button
            type="button"
            onClick={onDecreaseFontSize}
            disabled={fontSize <= 10}
            className="px-2 h-full flex items-center justify-center text-xs text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Decrease code font size"
            aria-label="Decrease code font size"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono text-[var(--foreground)]/80 select-none font-medium min-w-[34px] text-center">
            {fontSize}px
          </span>
          <button
            type="button"
            onClick={onIncreaseFontSize}
            disabled={fontSize >= 24}
            className="px-2 h-full flex items-center justify-center text-xs text-[var(--foreground)]/70 hover:text-[var(--foreground)] hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Increase code font size"
            aria-label="Increase code font size"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === "github" ? (
            <div className="flex items-center bg-black/40 border border-[var(--border)] rounded-xl p-1 backdrop-blur-md">
              <button
                onClick={onToggleInlineDiff}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  !inlineDiff
                    ? "bg-white/[0.1] text-sky-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Side by side"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggleInlineDiff}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  inlineDiff
                    ? "bg-white/[0.1] text-sky-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Inline unified diff"
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onToggleAntigravityView}
              className={`flex items-center gap-1.5 px-3 h-[38px] text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-sm ${
                antigravityView === "component"
                  ? "bg-[#7EC151]/20 text-[#7EC151] border-[#7EC151]/40 shadow-[0_0_12px_rgba(126,193,81,0.15)] font-bold"
                  : "bg-black/40 text-slate-300 border-[var(--border)] hover:bg-white/[0.08] hover:text-white"
              }`}
              title="Toggle Full Component Code View"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>View Component</span>
            </button>
          )}

          {lastAction && onUndo ? (
            <button
              onClick={onUndo}
              className="flex items-center gap-1.5 px-4 h-[38px] text-xs font-bold text-white bg-white/[0.1] hover:bg-white/[0.18] border border-white/20 rounded-xl transition-all shadow-md cursor-pointer"
              title={`Undo ${lastAction === "accept" ? "Accept" : "Reject"}`}
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Undo {lastAction === "accept" ? "Accept" : "Reject"}</span>
            </button>
          ) : (
            <>
              <button
                onClick={onAccept}
                className="flex items-center gap-1.5 px-3.5 h-[38px] text-xs font-bold text-black bg-[#7EC151] hover:bg-[#6ea843] rounded-xl transition-all shadow-[0_0_12px_rgba(126,193,81,0.2)] cursor-pointer"
              >
                {mode === "antigravity" ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Accept All</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Accept</span>
                  </>
                )}
              </button>

              <button
                onClick={onReject}
                className="flex items-center gap-1.5 px-3.5 h-[38px] text-xs font-bold text-white bg-[#AA1C41] hover:bg-[#911535] rounded-xl transition-all shadow-[0_0_12px_rgba(170,28,65,0.2)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{mode === "antigravity" ? "Reject All" : "Reject"}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
