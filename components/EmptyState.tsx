'use client';

import React from 'react';
import { FolderOpen, Sparkles, ShieldCheck, Undo2, CheckCircle2, RotateCw } from 'lucide-react';
import { useDiffEditor } from '@/providers/DiffEditorProvider';

export function EmptyState() {
  const editor = useDiffEditor();
  const {
    handleOpenFolder: onOpenFolder,
    isSupported,
    savedFolderName,
    handleReconnect: onReconnect
  } = editor;
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] p-6 text-center">
      <div className="max-w-xl w-full bg-[var(--panel)]/90 backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 shadow-2xl animate-slide-down transition-colors">
        <div className="w-16 h-16 bg-gradient-to-br from-[#7EC151]/25 to-[#7EC151]/5 border border-[#7EC151]/40 text-[#7EC151] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(126,193,81,0.2)] font-black text-2xl">
          Δ
        </div>

        <h1 className="text-3xl font-black text-[var(--foreground)] mb-3 flex items-center justify-center">
          Diff<span className="text-[#7EC151] drop-shadow-[0_0_12px_rgba(126,193,81,0.5)]">y</span>
        </h1>

        <p className="text-sm text-[var(--foreground)]/60 mb-8 leading-relaxed">
          Browser-native local diff code editor with real-time file system change detection, granular hunk review, and instant Accept/Reject controls.
        </p>

        {isSupported ? (
          <div className="space-y-3">
            {savedFolderName && (
              <button
                onClick={onReconnect}
                className="w-full flex items-center justify-center gap-3 bg-[#7EC151] hover:bg-[#6ea843] text-black font-bold py-3.5 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(126,193,81,0.25)] hover:shadow-[0_0_30px_rgba(126,193,81,0.4)] active:scale-[0.99] cursor-pointer"
              >
                <RotateCw className="w-5 h-5 stroke-[2.5]" />
                <span>Reconnect to {savedFolderName}</span>
              </button>
            )}

            <button
              onClick={onOpenFolder}
              className={`w-full flex items-center justify-center gap-3 font-bold py-3.5 px-6 rounded-2xl transition-all cursor-pointer ${
                savedFolderName
                  ? 'bg-white/[0.06] hover:bg-white/[0.1] text-[var(--foreground)] border border-[var(--border)]'
                  : 'bg-[#7EC151] hover:bg-[#6ea843] text-black shadow-[0_0_20px_rgba(126,193,81,0.25)] hover:shadow-[0_0_30px_rgba(126,193,81,0.4)] active:scale-[0.99]'
              }`}
            >
              <FolderOpen className="w-5 h-5 stroke-[2.5]" />
              <span>{savedFolderName ? 'Open Another Folder' : 'Open Project Folder'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 bg-[#AA1C41]/15 border border-[#AA1C41]/30 rounded-2xl text-[#ff4d73] text-sm">
            Your browser does not support the File System Access API. Please use Google Chrome, Microsoft Edge, or a Chromium-based browser.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mt-8 pt-8 border-t border-[var(--border)] text-left">
          <div className="p-3 bg-white/[0.02] border border-[var(--border-subtle)] rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[#7EC151] font-semibold text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Local</span>
            </div>
            <p className="text-[11px] text-[var(--foreground)]/50">
              Files never leave your machine.
            </p>
          </div>

          <div className="p-3 bg-white/[0.02] border border-[var(--border-subtle)] rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[#7EC151] font-semibold text-xs mb-1">
              <Undo2 className="w-3.5 h-3.5" />
              <span>Instant Undo</span>
            </div>
            <p className="text-[11px] text-[var(--foreground)]/50">
              Restore and revert any action anytime.
            </p>
          </div>

          <div className="p-3 bg-white/[0.02] border border-[var(--border-subtle)] rounded-xl backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[#7EC151] font-semibold text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Hunk Control</span>
            </div>
            <p className="text-[11px] text-[var(--foreground)]/50">
              Accept and reject block by block.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
