'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useDiffEditorState, DiffEditorState } from '@/hooks/useDiffEditor';

const DiffEditorContext = createContext<DiffEditorState | null>(null);

export function DiffEditorProvider({ children }: { children: ReactNode }) {
  const value = useDiffEditorState();
  return (
    <DiffEditorContext.Provider value={value}>
      {children}
    </DiffEditorContext.Provider>
  );
}

export function useDiffEditor(): DiffEditorState {
  const context = useContext(DiffEditorContext);
  if (!context) {
    throw new Error('useDiffEditor must be used within DiffEditorProvider');
  }
  return context;
}
