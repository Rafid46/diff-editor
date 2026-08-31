'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DiffViewer } from '@/components/DiffViewer';
import { EmptyState } from '@/components/EmptyState';
import { useDiffEditor } from '@/hooks/useDiffEditor';
import { getSelectedDiffItem, getFileActionState, calculateTotals } from '@/lib/utils';

export default function DiffEditorPage() {
  const editor = useDiffEditor();

  const selectedDiffItem = getSelectedDiffItem(
    editor.diffItems,
    editor.acceptedItems,
    editor.currentFiles,
    editor.selectedPath
  );

  const lastFileAction = getFileActionState(
    editor.selectedPath,
    editor.acceptedItems,
    editor.rejectedFiles
  );

  const { additions: totalAdditions, deletions: totalDeletions } = calculateTotals(editor.diffItems);

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden select-none transition-colors">
      <Header
        folderName={editor.folderName}
        isTracking={editor.isTracking}
        isScanning={editor.isScanning}
        diffCount={editor.diffItems.length}
        totalAdditions={totalAdditions}
        totalDeletions={totalDeletions}
        theme={editor.theme}
        onThemeChange={editor.setTheme}
        onToggleTracking={editor.handleToggleTracking}
        onManualScan={editor.handleManualScan}
        onOpenFolder={editor.handleOpenFolder}
        onRemoveProject={editor.handleRemoveProject}
        diffMode={editor.diffMode}
        onChangeMode={editor.setDiffMode}
      />

      {editor.isInitializing ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--background)]" />
      ) : !editor.dirHandle ? (
        <EmptyState
          onOpenFolder={editor.handleOpenFolder}
          isSupported={editor.isSupported}
          savedFolderName={editor.savedFolderName}
          onReconnect={editor.handleReconnect}
        />
      ) : (
        <main className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
          <Sidebar
            diffItems={editor.diffItems}
            acceptedItems={editor.acceptedItems}
            selectedPath={editor.selectedPath}
            isTracking={editor.isTracking}
            onSelectFile={editor.handleSelectFile}
            onAcceptFile={editor.handleAcceptFile}
            onRejectFile={editor.handleRejectFile}
            onUndoAction={editor.handleUndoAction}
          />

          <DiffViewer
            item={selectedDiffItem}
            mode={editor.diffMode}
            inlineDiff={editor.inlineDiff}
            onToggleInlineDiff={() => editor.setInlineDiff(prev => !prev)}
            fontSize={editor.codeFontSize}
            onIncreaseFontSize={() => editor.setCodeFontSize(s => Math.min(s + 1, 24))}
            onDecreaseFontSize={() => editor.setCodeFontSize(s => Math.max(s - 1, 10))}
            onAccept={editor.handleAcceptFile}
            onReject={editor.handleRejectFile}
            onUndo={editor.handleUndoAction}
            lastAction={lastFileAction}
            hunkActions={editor.hunkActions}
            onAcceptHunk={editor.handleAcceptHunk}
            onRejectHunk={editor.handleRejectHunk}
            onUndoHunk={editor.handleUndoHunk}
          />
        </main>
      )}
    </div>
  );
}
