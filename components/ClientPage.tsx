'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DiffViewer } from '@/components/DiffViewer';
import { EmptyState } from '@/components/EmptyState';
import { useDiffEditor } from '@/providers/DiffEditorProvider';

export function ClientPage() {
  const editor = useDiffEditor();

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden select-none transition-colors">
      <Header />

      {editor.isInitializing ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--background)]" />
      ) : !editor.dirHandle ? (
        <EmptyState />
      ) : (
        <main className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
          <Sidebar />
          <DiffViewer />
        </main>
      )}
    </div>
  );
}
