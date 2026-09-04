'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  FolderOpen,
  Moon,
  MoonStar,
  Sparkles,
  CircleDot,
  X,
  ChevronDown,
  Check,
  GitCompare,
  Zap
} from 'lucide-react';
import { AppTheme, DiffMode } from '@/types/diff';
import { useDiffEditor } from '@/providers/DiffEditorProvider';

interface ThemeOption {
  id: AppTheme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const THEMES: ThemeOption[] = [
  { id: 'dark', label: 'Dark Default', icon: Moon },
  { id: 'nightowl', label: 'Night Owl', icon: MoonStar },
  { id: 'gray', label: 'Zinc Gray', icon: CircleDot },
  { id: 'antigravity', label: 'Antigravity', icon: Sparkles },
];

export function Header() {
  const editor = useDiffEditor();
  const {
    folderName,
    isTracking,
    isScanning,
    diffItems,
    totalAdditions,
    totalDeletions,
    theme,
    setTheme: onThemeChange,
    handleToggleTracking: onToggleTracking,
    handleManualScan: onManualScan,
    handleOpenFolder: onOpenFolder,
    handleRemoveProject: onRemoveProject,
    diffMode,
    setDiffMode: onChangeMode
  } = editor;
  const diffCount = diffItems.length;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const CurrentIcon = currentTheme.icon;

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
          <>
            <div className="h-[36px] ml-4 rounded-full border border-white/10 bg-black/20 backdrop-blur-md p-1 flex items-center gap-1">
              <button
                onClick={() => onChangeMode("github")}
                className={`h-full px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  diffMode === "github"
                    ? "bg-white/[0.12] text-white shadow-sm border border-white/10"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <GitCompare className="w-3 h-3" />
                <span>GitHub Mode</span>
              </button>
              <button
                onClick={() => onChangeMode("antigravity")}
                className={`h-full px-3 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  diffMode === "antigravity"
                    ? "bg-[#a855f7]/20 text-[#d8b4fe] border border-[#a855f7]/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                <Zap className="w-3 h-3 fill-current" />
                <span>Antigravity Mode</span>
              </button>
            </div>

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
          </>
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

        <div ref={dropdownRef} className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-[var(--border)] text-xs font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-all cursor-pointer shadow-sm"
            aria-label="Switch theme"
            aria-expanded={isOpen}
          >
            <CurrentIcon className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline font-medium">{currentTheme.label}</span>
            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1.5 w-44 py-1 bg-[var(--panel)] border border-[var(--border)] rounded-2xl shadow-2xl backdrop-blur-2xl z-50 animate-slide-down">
              {THEMES.map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onThemeChange(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.08] text-[var(--foreground)] font-semibold'
                        : 'text-[var(--foreground)]/70 hover:bg-white/[0.05] hover:text-[var(--foreground)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#7EC151]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
