import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Search, 
  Check, 
  RotateCcw, 
  FilePlus, 
  FileMinus, 
  FileEdit,
  CheckCircle,
  Clock,
  Undo2,
  CheckCircle2
} from 'lucide-react';
import { FileDiffItem, FileChangeStatus, AcceptedFileItem, SidebarTab } from '@/types/diff';

interface SidebarProps {
  diffItems: FileDiffItem[];
  acceptedItems?: AcceptedFileItem[];
  selectedPath: string | null;
  isTracking: boolean;
  onSelectFile: (path: string) => void;
  onAcceptFile: (path: string) => void;
  onRejectFile: (path: string) => void;
  onUndoAction?: (path: string) => void;
}

export function Sidebar({
  diffItems,
  acceptedItems = [],
  selectedPath,
  isTracking,
  onSelectFile,
  onAcceptFile,
  onRejectFile,
  onUndoAction
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('changed');
  const [search, setSearch] = useState('');
  const [width, setWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = mouseMoveEvent.clientX;
      if (newWidth >= 220 && newWidth <= 560) {
        setWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const filteredDiffItems = diffItems.filter(item =>
    item.path.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAcceptedItems = acceptedItems.filter(item =>
    item.path.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: FileChangeStatus) => {
    switch (status) {
      case 'added':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7EC151] bg-[#7EC151]/15 border border-[#7EC151]/30 px-1.5 py-0.5 rounded-md">
            <FilePlus className="w-3 h-3" />
            <span>A</span>
          </span>
        );
      case 'deleted':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#AA1C41] bg-[#AA1C41]/15 border border-[#AA1C41]/30 px-1.5 py-0.5 rounded-md">
            <FileMinus className="w-3 h-3" />
            <span>D</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#AA1C41] bg-[#AA1C41]/15 border border-[#AA1C41]/30 px-1.5 py-0.5 rounded-md" title="Rejected (Reverted)">
            <RotateCcw className="w-3 h-3" />
            <span>R</span>
          </span>
        );
      case 'modified':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded-md">
            <FileEdit className="w-3 h-3" />
            <span>M</span>
          </span>
        );
    }
  };

  return (
    <aside 
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="bg-[var(--panel)]/95 backdrop-blur-xl border-r border-[var(--border)] flex flex-col h-full shrink-0 select-none relative z-10 transition-colors"
    >
      <div className="p-3 border-b border-[var(--border)] space-y-2.5">
        <div className="flex items-center bg-black/30 border border-[var(--border)] rounded-xl p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('changed')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'changed'
                ? 'bg-white/[0.1] text-[var(--foreground)] shadow-sm'
                : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'
            }`}
          >
            <span>Changed</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/[0.06] rounded-full border border-[var(--border-subtle)]">
              {diffItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'accepted'
                ? 'bg-[#7EC151]/20 text-[#7EC151] shadow-sm font-bold'
                : 'text-[var(--foreground)]/50 hover:text-[var(--foreground)]'
            }`}
          >
            <span>Accepted</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/[0.06] rounded-full border border-[var(--border-subtle)]">
              {acceptedItems.length}
            </span>
          </button>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground)]/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={activeTab === 'changed' ? 'Filter changes...' : 'Filter accepted...'}
            className="w-full bg-white/[0.03] border border-[var(--border)] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[var(--foreground)] placeholder-[var(--foreground)]/40 focus:outline-none focus:border-[#7EC151]/60 focus:bg-white/[0.06] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {activeTab === 'changed' ? (
          filteredDiffItems.length === 0 ? (
            <div className="p-6 text-center text-[var(--foreground)]/40 flex flex-col items-center justify-center h-full">
              {diffItems.length === 0 ? (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center mb-3 shadow-inner">
                    {isTracking ? (
                      <Clock className="w-5 h-5 text-sky-400 animate-pulse" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-[#7EC151]" />
                    )}
                  </div>
                  <p className="text-xs font-medium text-[var(--foreground)]/90 mb-1">
                    {isTracking ? 'All changes accepted or clean' : 'Workspace clean'}
                  </p>
                  <p className="text-[11px] text-[var(--foreground)]/40 leading-relaxed">
                    {isTracking
                      ? 'New edits will appear here automatically.'
                      : 'Click "Start Tracking" to record baseline.'}
                  </p>
                </>
              ) : (
                <p className="text-xs">No files match your filter.</p>
              )}
            </div>
          ) : (
            filteredDiffItems.map(item => {
              const isSelected = selectedPath === item.path;
              const pathParts = item.path.split('/');
              const fileName = pathParts.pop() || item.path;
              const dirPath = pathParts.join('/');
              const isRejected = item.status === 'rejected';

              return (
                <div
                  key={item.path}
                  onClick={() => onSelectFile(item.path)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white/[0.08] border-[#7EC151]/40 shadow-[0_0_15px_rgba(126,193,81,0.12)]'
                      : 'bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.06] hover:border-[var(--border)] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <div className="mt-0.5 shrink-0">
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--foreground)] truncate">
                        {fileName}
                      </div>
                      {dirPath && (
                        <div className="text-[10px] text-[var(--foreground)]/50 truncate">
                          {dirPath}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center gap-1 text-[11px] font-mono group-hover:hidden">
                      {item.additions > 0 && (
                        <span className="text-[#7EC151]">+{item.additions}</span>
                      )}
                      {item.deletions > 0 && (
                        <span className="text-[#AA1C41]">-{item.deletions}</span>
                      )}
                    </div>

                    <div className="hidden group-hover:flex items-center gap-1">
                      {!isRejected ? (
                        <>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onAcceptFile(item.path);
                            }}
                            className="p-1.5 rounded-lg bg-[#7EC151]/15 hover:bg-[#7EC151] text-[#7EC151] hover:text-black transition-all cursor-pointer"
                            title="Accept change"
                          >
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onRejectFile(item.path);
                            }}
                            className="p-1.5 rounded-lg bg-[#AA1C41]/15 hover:bg-[#AA1C41] text-[#AA1C41] hover:text-white transition-all cursor-pointer"
                            title="Reject and revert change"
                          >
                            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </>
                      ) : (
                        onUndoAction && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onUndoAction(item.path);
                            }}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[var(--foreground)]/80 hover:text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                            title="Undo reject and restore modification"
                          >
                            <Undo2 className="w-3 h-3 stroke-[2.5]" />
                            <span>Undo</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          filteredAcceptedItems.length === 0 ? (
            <div className="p-6 text-center text-[var(--foreground)]/40 flex flex-col items-center justify-center h-full">
              <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-[var(--border)] flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-medium text-[var(--foreground)]/90 mb-1">
                No accepted files yet
              </p>
              <p className="text-[11px] text-[var(--foreground)]/40 leading-relaxed">
                When all changes on a file are accepted, it will appear here.
              </p>
            </div>
          ) : (
            filteredAcceptedItems.map(item => {
              const isSelected = selectedPath === item.path;
              const pathParts = item.path.split('/');
              const fileName = pathParts.pop() || item.path;
              const dirPath = pathParts.join('/');

              return (
                <div
                  key={item.path}
                  onClick={() => onSelectFile(item.path)}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white/[0.08] border-[#7EC151]/40 shadow-[0_0_15px_rgba(126,193,81,0.12)]'
                      : 'bg-white/[0.02] border-[var(--border-subtle)] hover:bg-white/[0.06] hover:border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <div className="mt-0.5 shrink-0">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#7EC151] bg-[#7EC151]/15 border border-[#7EC151]/30 px-1.5 py-0.5 rounded-md" title="Accepted">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--foreground)] truncate">
                        {fileName}
                      </div>
                      {dirPath && (
                        <div className="text-[10px] text-[var(--foreground)]/50 truncate">
                          {dirPath}
                        </div>
                      )}
                    </div>
                  </div>

                  {onUndoAction && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onUndoAction(item.path);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[var(--foreground)]/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-[var(--border)] rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                      title="Undo Accept"
                    >
                      <Undo2 className="w-3 h-3 stroke-[2.5]" />
                      <span>Undo</span>
                    </button>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      <div
        onMouseDown={startResizing}
        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-[#7EC151]/40 transition-colors z-20 ${
          isResizing ? 'bg-[#7EC151] shadow-[0_0_8px_rgba(126,193,81,0.5)]' : 'bg-transparent'
        }`}
        title="Drag to resize sidebar"
      />
    </aside>
  );
}
