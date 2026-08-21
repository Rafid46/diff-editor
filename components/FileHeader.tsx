import React from 'react';
import { 
  Check, 
  RotateCcw, 
  Columns, 
  AlignJustify,
  GitCompare,
  Zap,
  CheckCheck,
  Code2,
  Undo2
} from 'lucide-react';
import { DiffMode, AntigravityViewMode } from '@/types/diff';

interface FileHeaderProps {
  path: string;
  additions: number;
  deletions: number;
  mode: DiffMode;
  onChangeMode: (mode: DiffMode) => void;
  inlineDiff: boolean;
  onToggleInlineDiff: () => void;
  antigravityView?: AntigravityViewMode;
  onToggleAntigravityView?: () => void;
  onAccept: () => void;
  onReject: () => void;
  onUndo?: () => void;
  lastAction?: 'accept' | 'reject' | null;
  blockCount?: number;
}

export function FileHeader({
  path,
  additions,
  deletions,
  mode,
  onChangeMode,
  inlineDiff,
  onToggleInlineDiff,
  antigravityView = 'component',
  onToggleAntigravityView,
  onAccept,
  onReject,
  onUndo,
  lastAction,
  blockCount
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
        {mode === 'antigravity' && typeof blockCount === 'number' && (
          <span className="text-[11px] font-mono text-[var(--foreground)]/60 bg-white/[0.04] border border-[var(--border)] px-2 py-0.5 rounded-full shrink-0">
            {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="h-[52px] rounded-full border border-white/10 bg-black/40 backdrop-blur-md p-1.5 flex items-center gap-1">
          <button
            onClick={() => onChangeMode('github')}
            className={`h-full px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'github'
                ? 'bg-white/[0.12] text-white shadow-sm border border-white/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>GitHub Mode</span>
          </button>
          <button
            onClick={() => onChangeMode('antigravity')}
            className={`h-full px-4 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              mode === 'antigravity'
                ? 'bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Antigravity Mode</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {mode === 'github' ? (
            <div className="flex items-center bg-black/40 border border-[var(--border)] rounded-xl p-1 backdrop-blur-md">
              <button
                onClick={onToggleInlineDiff}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  !inlineDiff ? 'bg-white/[0.1] text-sky-400 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Side by side"
              >
                <Columns className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onToggleInlineDiff}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  inlineDiff ? 'bg-white/[0.1] text-sky-400 shadow-sm' : 'text-slate-400 hover:text-white'
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
                antigravityView === 'component'
                  ? 'bg-[#7EC151]/20 text-[#7EC151] border-[#7EC151]/40 shadow-[0_0_12px_rgba(126,193,81,0.15)] font-bold'
                  : 'bg-black/40 text-slate-300 border-[var(--border)] hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Toggle Full Component Code View"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Component Code</span>
            </button>
          )}

          {lastAction && onUndo ? (
            <button
              onClick={onUndo}
              className="flex items-center gap-1.5 px-4 h-[38px] text-xs font-bold text-white bg-white/[0.1] hover:bg-white/[0.18] border border-white/20 rounded-xl transition-all shadow-md cursor-pointer"
              title={`Undo ${lastAction === 'accept' ? 'Accept' : 'Reject'}`}
            >
              <Undo2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Undo {lastAction === 'accept' ? 'Accept' : 'Reject'}</span>
            </button>
          ) : (
            <>
              <button
                onClick={onAccept}
                className="flex items-center gap-1.5 px-3.5 h-[38px] text-xs font-bold text-black bg-[#7EC151] hover:bg-[#6ea843] rounded-xl transition-all shadow-[0_0_12px_rgba(126,193,81,0.2)] cursor-pointer"
              >
                {mode === 'antigravity' ? (
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
                <span>{mode === 'antigravity' ? 'Reject All' : 'Reject'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
