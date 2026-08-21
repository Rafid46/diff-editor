import React from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  FolderOpen,
  Sun,
  Moon,
  Sparkles,
  CircleDot,
  X
} from 'lucide-react';
import { AppTheme } from '@/types/diff';

interface HeaderProps {
  folderName: string | null;
  isTracking: boolean;
  isScanning: boolean;
  diffCount: number;
  totalAdditions: number;
  totalDeletions: number;
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onToggleTracking: () => void;
  onManualScan: () => void;
  onOpenFolder: () => void;
  onRemoveProject?: () => void;
}

export function Header({
  folderName,
  isTracking,
  isScanning,
  diffCount,
  totalAdditions,
  totalDeletions,
  theme,
  onThemeChange,
  onToggleTracking,
  onManualScan,
  onOpenFolder,
  onRemoveProject
}: HeaderProps) {
  const cycleTheme = () => {
    if (theme === 'dark') onThemeChange('gray');
    else if (theme === 'gray') onThemeChange('light');
    else if (theme === 'light') onThemeChange('antigravity');
    else onThemeChange('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'gray') return <CircleDot className="w-3.5 h-3.5 text-zinc-400" />;
    if (theme === 'light') return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    if (theme === 'antigravity') return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    return <Moon className="w-3.5 h-3.5 text-sky-400" />;
  };

  return (
    <header className="h-14 bg-[var(--panel)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 flex items-center justify-between shrink-0 select-none z-20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7EC151]/25 to-[#7EC151]/5 border border-[#7EC151]/40 flex items-center justify-center text-[#7EC151] font-black text-sm shadow-[0_0_15px_rgba(126,193,81,0.2)]">
            Δ
          </div>
          <span className="font-black text-base text-[var(--foreground)] flex items-center">
            Diff<span className="text-[#7EC151] drop-shadow-[0_0_8px_rgba(126,193,81,0.4)]">y</span>
          </span>
        </div>

        {folderName && (
          <div className="flex items-center gap-2 pl-3 border-l border-[var(--border)]">
            <div className="flex items-center gap-1 bg-white/[0.04] border border-[var(--border)] rounded-xl p-1 shadow-sm">
              <button
                onClick={onOpenFolder}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-all cursor-pointer"
                title="Change project directory"
              >
                <FolderOpen className="w-3.5 h-3.5 opacity-70 text-[#7EC151]" />
                <span className="max-w-[160px] truncate">{folderName}</span>
              </button>

              {onRemoveProject && (
                <button
                  onClick={onRemoveProject}
                  className="p-1 hover:bg-[#AA1C41]/20 text-[var(--foreground)]/40 hover:text-[#AA1C41] rounded-lg transition-all cursor-pointer"
                  title="Remove project and clear all data"
                >
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {folderName && (
          <>
            <div className="flex items-center bg-black/40 border border-[var(--border)] rounded-xl p-1 backdrop-blur-md">
              <button
                onClick={onToggleTracking}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isTracking
                    ? 'bg-[#7EC151] text-black shadow-[0_0_15px_rgba(126,193,81,0.3)] font-bold'
                    : 'bg-white/[0.06] text-[var(--foreground)]/80 hover:bg-white/[0.1] hover:text-[var(--foreground)]'
                }`}
                title={isTracking ? 'Tracking is active. Click to pause/reset baseline.' : 'Click to start tracking changes.'}
              >
                {isTracking ? (
                  <>
                    <Square className="w-3 h-3 fill-current" />
                    <span>Tracking Changes</span>
                    <span className="w-2 h-2 rounded-full bg-black animate-subtle-pulse ml-0.5" />
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-[#7EC151]" />
                    <span>Start Tracking</span>
                  </>
                )}
              </button>

              <button
                onClick={onManualScan}
                disabled={isScanning}
                className="p-1.5 text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-white/[0.08] rounded-lg transition-all cursor-pointer disabled:opacity-40 ml-1"
                title="Scan project for file changes now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-black/30 border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs backdrop-blur-md">
              <span className="text-[var(--foreground)]/60">
                {diffCount === 0 ? 'No changes' : `${diffCount} file${diffCount > 1 ? 's' : ''}`}
              </span>
              {diffCount > 0 && (
                <>
                  <span className="text-[#7EC151] font-semibold">+{totalAdditions}</span>
                  <span className="text-[#AA1C41] font-semibold">-{totalDeletions}</span>
                </>
              )}
            </div>
          </>
        )}

        <button
          onClick={cycleTheme}
          className="flex items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border)] text-xs font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-all cursor-pointer shadow-sm"
          title={`Current theme: ${theme}. Click to switch theme.`}
        >
          {getThemeIcon()}
          <span className="capitalize text-[11px] hidden sm:inline">{theme}</span>
        </button>
      </div>
    </header>
  );
}
