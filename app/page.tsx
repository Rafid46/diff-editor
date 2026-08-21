'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DiffViewer } from '@/components/DiffViewer';
import { EmptyState } from '@/components/EmptyState';
import { FileDiffItem, SnapshotMap, DiffMode, DiffHunkBlock, AppTheme, AcceptedFileItem } from '@/types/diff';
import { 
  readDirectoryRecursive, 
  writeToFile, 
  deleteFileByPath, 
  getFileHandleFromPath 
} from '@/lib/file-system';
import { 
  computeFileDiffs, 
  applyRejectHunk, 
  applyAcceptHunk 
} from '@/lib/diff-calculator';
import { 
  saveSessionData, 
  getSessionData, 
  verifyHandlePermission 
} from '@/lib/storage';

export default function DiffEditorPage() {
  const [isSupported, setIsSupported] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [savedHandle, setSavedHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [savedFolderName, setSavedFolderName] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [inlineDiff, setInlineDiff] = useState(false);
  const [diffMode, setDiffMode] = useState<DiffMode>('antigravity');
  const [theme, setTheme] = useState<AppTheme>('dark');
  
  const [baselineSnapshot, setBaselineSnapshot] = useState<SnapshotMap>({});
  const [currentFiles, setCurrentFiles] = useState<Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>>(new Map());
  const [diffItems, setDiffItems] = useState<FileDiffItem[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<AcceptedFileItem[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const baselineRef = useRef<SnapshotMap>({});
  baselineRef.current = baselineSnapshot;

  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  dirHandleRef.current = dirHandle;

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'showDirectoryPicker' in window);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      }
    }
  }, [theme]);

  const scanFiles = useCallback(async (
    targetDir: FileSystemDirectoryHandle,
    snapshot: SnapshotMap
  ) => {
    try {
      setIsScanning(true);
      const files = await readDirectoryRecursive(targetDir);
      setCurrentFiles(files);
      const diffs = computeFileDiffs(snapshot, files);
      setDiffItems(diffs);

      setSelectedPath(prev => {
        if (!prev && diffs.length > 0) return diffs[0].path;
        if (prev && !diffs.some(d => d.path === prev)) {
          return diffs.length > 0 ? diffs[0].path : null;
        }
        return prev;
      });
    } catch {
    } finally {
      setIsScanning(false);
    }
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const handle = await getSessionData<FileSystemDirectoryHandle>('dirHandle');
        const name = await getSessionData<string>('folderName');
        const snapshot = await getSessionData<SnapshotMap>('baselineSnapshot');
        const path = await getSessionData<string>('selectedPath');
        const savedAccepted = await getSessionData<AcceptedFileItem[]>('acceptedItems');

        if (savedAccepted) {
          setAcceptedItems(savedAccepted);
        }

        if (handle && name && snapshot) {
          setSavedHandle(handle);
          setSavedFolderName(name);
          setBaselineSnapshot(snapshot);
          baselineRef.current = snapshot;

          try {
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
              setDirHandle(handle);
              setFolderName(name);
              setIsTracking(true);
              await scanFiles(handle, snapshot);
              if (path) setSelectedPath(path);
            }
          } catch {
          }
        }
      } finally {
        setIsInitializing(false);
      }
    }
    restoreSession();
  }, [scanFiles]);

  const handleOpenFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) return;
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      setDirHandle(handle);
      setFolderName(handle.name);
      setSavedHandle(handle);
      setSavedFolderName(handle.name);

      setIsScanning(true);
      const files = await readDirectoryRecursive(handle);
      setCurrentFiles(files);

      const snapshot: SnapshotMap = {};
      for (const [path, data] of files.entries()) {
        if (!data.isBinary) {
          snapshot[path] = data.content;
        }
      }

      setBaselineSnapshot(snapshot);
      baselineRef.current = snapshot;
      setIsTracking(true);
      setAcceptedItems([]);

      await saveSessionData('dirHandle', handle);
      await saveSessionData('folderName', handle.name);
      await saveSessionData('baselineSnapshot', snapshot);
      await saveSessionData('acceptedItems', []);

      const diffs = computeFileDiffs(snapshot, files);
      setDiffItems(diffs);
      const initialPath = diffs.length > 0 ? diffs[0].path : null;
      setSelectedPath(initialPath);
      if (initialPath) {
        await saveSessionData('selectedPath', initialPath);
      }
    } catch {
    } finally {
      setIsScanning(false);
    }
  };

  const handleReconnect = async () => {
    if (!savedHandle || !savedFolderName) return;
    try {
      const granted = await verifyHandlePermission(savedHandle);
      if (granted) {
        setDirHandle(savedHandle);
        setFolderName(savedFolderName);
        setIsTracking(true);
        await scanFiles(savedHandle, baselineRef.current);
      }
    } catch {
    }
  };

  const handleToggleTracking = async () => {
    if (!dirHandle) return;

    if (!isTracking) {
      setIsScanning(true);
      const files = await readDirectoryRecursive(dirHandle);
      setCurrentFiles(files);

      const newSnapshot: SnapshotMap = {};
      for (const [path, data] of files.entries()) {
        if (!data.isBinary) {
          newSnapshot[path] = data.content;
        }
      }

      setBaselineSnapshot(newSnapshot);
      baselineRef.current = newSnapshot;
      setIsTracking(true);
      setDiffItems([]);
      setAcceptedItems([]);
      setSelectedPath(null);
      setIsScanning(false);
      await saveSessionData('baselineSnapshot', newSnapshot);
      await saveSessionData('acceptedItems', []);
    } else {
      setIsTracking(false);
    }
  };

  const handleAcceptFile = (path: string) => {
    const currentData = currentFiles.get(path);
    const originalBaselineContent = baselineRef.current[path] ?? '';
    const updatedSnapshot = { ...baselineRef.current };

    if (currentData) {
      updatedSnapshot[path] = currentData.content;
    } else {
      delete updatedSnapshot[path];
    }

    const fileName = path.split('/').pop() || path;
    const newAcceptedItem: AcceptedFileItem = {
      path,
      name: fileName,
      originalContent: originalBaselineContent,
      acceptedContent: currentData?.content ?? '',
      timestamp: Date.now()
    };

    setAcceptedItems(prev => {
      const filtered = prev.filter(i => i.path !== path);
      const updated = [newAcceptedItem, ...filtered];
      saveSessionData('acceptedItems', updated);
      return updated;
    });

    setBaselineSnapshot(updatedSnapshot);
    baselineRef.current = updatedSnapshot;
    saveSessionData('baselineSnapshot', updatedSnapshot);

    const diffs = computeFileDiffs(updatedSnapshot, currentFiles);
    setDiffItems(diffs);

    if (selectedPath === path) {
      setSelectedPath(diffs.length > 0 ? diffs[0].path : null);
    }
  };

  const handleUndoAccept = (path: string) => {
    const item = acceptedItems.find(i => i.path === path);
    if (!item) return;

    const updatedSnapshot = { ...baselineRef.current };
    if (item.originalContent !== undefined) {
      updatedSnapshot[path] = item.originalContent;
    }

    setAcceptedItems(prev => {
      const updated = prev.filter(i => i.path !== path);
      saveSessionData('acceptedItems', updated);
      return updated;
    });

    setBaselineSnapshot(updatedSnapshot);
    baselineRef.current = updatedSnapshot;
    saveSessionData('baselineSnapshot', updatedSnapshot);

    const diffs = computeFileDiffs(updatedSnapshot, currentFiles);
    setDiffItems(diffs);
    setSelectedPath(path);
    saveSessionData('selectedPath', path);
  };

  const handleRejectFile = async (path: string) => {
    if (!dirHandle) return;

    const originalContent = baselineRef.current[path];
    const currentData = currentFiles.get(path);

    try {
      if (originalContent === undefined) {
        if (currentData) {
          await deleteFileByPath(dirHandle, path);
        }
      } else {
        const fileHandle = await getFileHandleFromPath(dirHandle, path, true);
        await writeToFile(fileHandle, originalContent);
      }

      await scanFiles(dirHandle, baselineRef.current);
    } catch {
    }
  };

  const handleAcceptHunk = (path: string, hunk: DiffHunkBlock) => {
    const originalContent = baselineRef.current[path] ?? '';
    const updatedBaseline = applyAcceptHunk(originalContent, hunk);

    const updatedSnapshot = { ...baselineRef.current, [path]: updatedBaseline };
    setBaselineSnapshot(updatedSnapshot);
    baselineRef.current = updatedSnapshot;
    saveSessionData('baselineSnapshot', updatedSnapshot);

    const diffs = computeFileDiffs(updatedSnapshot, currentFiles);
    setDiffItems(diffs);

    if (selectedPath === path && !diffs.some(d => d.path === path)) {
      setSelectedPath(diffs.length > 0 ? diffs[0].path : null);
    }
  };

  const handleRejectHunk = async (path: string, hunk: DiffHunkBlock) => {
    if (!dirHandle) return;
    const currentContent = currentFiles.get(path)?.content ?? '';
    const restoredContent = applyRejectHunk(currentContent, hunk);

    try {
      const fileHandle = await getFileHandleFromPath(dirHandle, path, true);
      await writeToFile(fileHandle, restoredContent);
      await scanFiles(dirHandle, baselineRef.current);
    } catch {
    }
  };

  useEffect(() => {
    if (!isTracking || !dirHandle) return;

    const intervalId = setInterval(() => {
      if (dirHandleRef.current && !isScanning) {
        scanFiles(dirHandleRef.current, baselineRef.current);
      }
    }, 1500);

    return () => clearInterval(intervalId);
  }, [isTracking, dirHandle, isScanning, scanFiles]);

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    saveSessionData('selectedPath', path);
  };

  const selectedDiffItem = diffItems.find(item => item.path === selectedPath) || null;

  const totalAdditions = diffItems.reduce((sum, item) => sum + item.additions, 0);
  const totalDeletions = diffItems.reduce((sum, item) => sum + item.deletions, 0);

  return (
    <div className="flex flex-col h-screen w-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden select-none transition-colors">
      <Header
        folderName={folderName}
        isTracking={isTracking}
        isScanning={isScanning}
        diffCount={diffItems.length}
        totalAdditions={totalAdditions}
        totalDeletions={totalDeletions}
        theme={theme}
        onThemeChange={setTheme}
        onToggleTracking={handleToggleTracking}
        onManualScan={() => dirHandle && scanFiles(dirHandle, baselineRef.current)}
        onOpenFolder={handleOpenFolder}
      />

      {isInitializing ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--background)]" />
      ) : !dirHandle ? (
        <EmptyState
          onOpenFolder={handleOpenFolder}
          isSupported={isSupported}
          savedFolderName={savedFolderName}
          onReconnect={handleReconnect}
        />
      ) : (
        <main className="flex flex-1 h-[calc(100vh-56px)] overflow-hidden">
          <Sidebar
            diffItems={diffItems}
            acceptedItems={acceptedItems}
            selectedPath={selectedPath}
            isTracking={isTracking}
            onSelectFile={handleSelectFile}
            onAcceptFile={handleAcceptFile}
            onRejectFile={handleRejectFile}
            onUndoAccept={handleUndoAccept}
          />

          <DiffViewer
            item={selectedDiffItem}
            mode={diffMode}
            onChangeMode={setDiffMode}
            inlineDiff={inlineDiff}
            onToggleInlineDiff={() => setInlineDiff(prev => !prev)}
            onAccept={handleAcceptFile}
            onReject={handleRejectFile}
            onAcceptHunk={handleAcceptHunk}
            onRejectHunk={handleRejectHunk}
          />
        </main>
      )}
    </div>
  );
}
