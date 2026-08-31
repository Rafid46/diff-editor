import { useState, useEffect, useCallback, useRef } from 'react';
import { FileDiffItem, SnapshotMap, DiffMode, DiffHunkBlock, AppTheme, AcceptedFileItem } from '@/types/diff';
import { 
  readDirectoryRecursive, 
  writeToFile, 
  deleteFileByPath, 
  getFileHandleFromPath,
  clearFileSystemCache 
} from '@/lib/file-system';
import { 
  computeFileDiffs, 
  calculateLineChanges,
  applyRejectHunk, 
  applyAcceptHunk 
} from '@/lib/diff-calculator';
import { 
  saveSessionData, 
  getSessionData, 
  clearSessionData,
  verifyHandlePermission 
} from '@/lib/storage';

export interface RejectedFileData {
  originalBaseline: string;
  rejectedDiskContent: string;
  additions: number;
  deletions: number;
}

export function useDiffEditor() {
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
  const [codeFontSize, setCodeFontSize] = useState<number>(13);
  
  const [baselineSnapshot, setBaselineSnapshot] = useState<SnapshotMap>({});
  const [currentFiles, setCurrentFiles] = useState<Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>>(new Map());
  const [diffItems, setDiffItems] = useState<FileDiffItem[]>([]);
  const [acceptedItems, setAcceptedItems] = useState<AcceptedFileItem[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<Record<string, RejectedFileData>>({});
  const [hunkActions, setHunkActions] = useState<Record<string, 'accept' | 'reject'>>({});
  const [hunkOriginals, setHunkOriginals] = useState<Record<string, { oldContent: string; newContent: string }>>({});
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const baselineRef = useRef<SnapshotMap>({});
  baselineRef.current = baselineSnapshot;

  const rejectedFilesRef = useRef<Record<string, RejectedFileData>>({});
  rejectedFilesRef.current = rejectedFiles;

  const acceptedItemsRef = useRef<AcceptedFileItem[]>([]);
  acceptedItemsRef.current = acceptedItems;

  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  dirHandleRef.current = dirHandle;

  const isScanningRef = useRef(false);
  isScanningRef.current = isScanning;

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'showDirectoryPicker' in window);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      if ((theme as string) === 'light') {
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
    if (isScanningRef.current) return;
    try {
      setIsScanning(true);
      const files = await readDirectoryRecursive(targetDir);
      setCurrentFiles(files);
      const liveDiffs = computeFileDiffs(snapshot, files);

      const mergedDiffs = liveDiffs.filter(d => !acceptedItemsRef.current.some(a => a.path === d.path));

      for (const [path, rej] of Object.entries(rejectedFilesRef.current)) {
        if (!mergedDiffs.some(d => d.path === path) && !acceptedItemsRef.current.some(a => a.path === path)) {
          mergedDiffs.push({
            path,
            name: path.split('/').pop() || path,
            status: 'rejected',
            originalContent: rej.originalBaseline,
            currentContent: rej.rejectedDiskContent,
            additions: rej.additions,
            deletions: rej.deletions,
            isBinary: false
          });
        }
      }

      mergedDiffs.sort((a, b) => a.path.localeCompare(b.path));
      setDiffItems(mergedDiffs);

      setSelectedPath(prev => {
        if (!prev && mergedDiffs.length > 0) return mergedDiffs[0].path;
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
        const savedRejected = await getSessionData<Record<string, RejectedFileData>>('rejectedFiles');

        if (savedAccepted) {
          setAcceptedItems(savedAccepted);
          acceptedItemsRef.current = savedAccepted;
        }
        if (savedRejected) {
          setRejectedFiles(savedRejected);
          rejectedFilesRef.current = savedRejected;
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

      clearFileSystemCache();
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
      acceptedItemsRef.current = [];
      setRejectedFiles({});
      rejectedFilesRef.current = {};
      setHunkActions({});

      await saveSessionData('dirHandle', handle);
      await saveSessionData('folderName', handle.name);
      await saveSessionData('baselineSnapshot', snapshot);
      await saveSessionData('acceptedItems', []);
      await saveSessionData('rejectedFiles', {});

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

  const handleRemoveProject = async () => {
    clearFileSystemCache();
    await clearSessionData();
    setDirHandle(null);
    setFolderName(null);
    setSavedHandle(null);
    setSavedFolderName(null);
    setIsTracking(false);
    setDiffItems([]);
    setAcceptedItems([]);
    acceptedItemsRef.current = [];
    setRejectedFiles({});
    rejectedFilesRef.current = {};
    setHunkActions({});
    setSelectedPath(null);
    setBaselineSnapshot({});
    baselineRef.current = {};
    setCurrentFiles(new Map());
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
      clearFileSystemCache();
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
      acceptedItemsRef.current = [];
      setRejectedFiles({});
      rejectedFilesRef.current = {};
      setHunkActions({});
      setSelectedPath(null);
      setIsScanning(false);
      await saveSessionData('baselineSnapshot', newSnapshot);
      await saveSessionData('acceptedItems', []);
      await saveSessionData('rejectedFiles', {});
    } else {
      setIsTracking(false);
    }
  };

  const handleAcceptFile = (path: string) => {
    const currentData = currentFiles.get(path);
    const rejData = rejectedFilesRef.current[path];
    const originalBaselineContent = baselineRef.current[path] ?? '';
    const updatedSnapshot = { ...baselineRef.current };

    const effectiveDiskContent = rejData ? rejData.rejectedDiskContent : (currentData?.content ?? '');

    if (effectiveDiskContent) {
      updatedSnapshot[path] = effectiveDiskContent;
    } else {
      delete updatedSnapshot[path];
    }

    const fileName = path.split('/').pop() || path;
    const newAcceptedItem: AcceptedFileItem = {
      path,
      name: fileName,
      type: 'accept',
      originalContent: originalBaselineContent,
      currentDiskContent: effectiveDiskContent,
      timestamp: Date.now()
    };

    const newAcceptedList = [newAcceptedItem, ...acceptedItemsRef.current.filter(i => i.path !== path)];
    setAcceptedItems(newAcceptedList);
    acceptedItemsRef.current = newAcceptedList;
    saveSessionData('acceptedItems', newAcceptedList);

    const newRejectedMap = { ...rejectedFilesRef.current };
    delete newRejectedMap[path];
    setRejectedFiles(newRejectedMap);
    rejectedFilesRef.current = newRejectedMap;
    saveSessionData('rejectedFiles', newRejectedMap);

    setBaselineSnapshot(updatedSnapshot);
    baselineRef.current = updatedSnapshot;
    saveSessionData('baselineSnapshot', updatedSnapshot);

    if (dirHandle && rejData) {
      getFileHandleFromPath(dirHandle, path, true).then(fileHandle => {
        writeToFile(fileHandle, effectiveDiskContent).then(() => {
          scanFiles(dirHandle, updatedSnapshot);
        });
      });
    } else if (dirHandle) {
      scanFiles(dirHandle, updatedSnapshot);
    }
  };

  const handleRejectFile = async (path: string) => {
    if (!dirHandle) return;

    const originalContent = baselineRef.current[path];
    const currentData = currentFiles.get(path);
    const diskContent = currentData?.content ?? '';

    const { additions, deletions } = calculateLineChanges(originalContent ?? '', diskContent);

    const newRejectedMap = {
      ...rejectedFilesRef.current,
      [path]: {
        originalBaseline: originalContent ?? '',
        rejectedDiskContent: diskContent,
        additions,
        deletions
      }
    };
    setRejectedFiles(newRejectedMap);
    rejectedFilesRef.current = newRejectedMap;
    saveSessionData('rejectedFiles', newRejectedMap);

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
      setSelectedPath(path);
    } catch {
    }
  };

  const handleUndoAction = async (path: string) => {
    const acceptedItem = acceptedItemsRef.current.find(i => i.path === path);
    const isRejected = rejectedFilesRef.current[path];

    if (acceptedItem) {
      const updatedSnapshot = { ...baselineRef.current };
      if (acceptedItem.originalContent !== undefined) {
        updatedSnapshot[path] = acceptedItem.originalContent;
      }
      setBaselineSnapshot(updatedSnapshot);
      baselineRef.current = updatedSnapshot;
      saveSessionData('baselineSnapshot', updatedSnapshot);

      const newAcceptedList = acceptedItemsRef.current.filter(i => i.path !== path);
      setAcceptedItems(newAcceptedList);
      acceptedItemsRef.current = newAcceptedList;
      saveSessionData('acceptedItems', newAcceptedList);

      if (dirHandle) {
        await scanFiles(dirHandle, updatedSnapshot);
      }
      setSelectedPath(path);
      saveSessionData('selectedPath', path);
    } else if (isRejected) {
      if (!dirHandle) return;
      try {
        const fileHandle = await getFileHandleFromPath(dirHandle, path, true);
        await writeToFile(fileHandle, isRejected.rejectedDiskContent);

        const newRejectedMap = { ...rejectedFilesRef.current };
        delete newRejectedMap[path];
        setRejectedFiles(newRejectedMap);
        rejectedFilesRef.current = newRejectedMap;
        saveSessionData('rejectedFiles', newRejectedMap);

        await scanFiles(dirHandle, baselineRef.current);
        setSelectedPath(path);
        saveSessionData('selectedPath', path);
      } catch {
      }
    }
  };

  const handleAcceptHunk = (path: string, hunk: DiffHunkBlock) => {
    const originalContent = baselineRef.current[path] ?? '';
    const updatedBaseline = applyAcceptHunk(originalContent, hunk);

    const currentData = currentFiles.get(path);
    if (currentData) {
      const { additions, deletions } = calculateLineChanges(updatedBaseline, currentData.content);
      if (additions === 0 && deletions === 0) {
        handleAcceptFile(path);
        return;
      }
    }

    setHunkActions(prev => ({ ...prev, [hunk.id]: 'accept' }));
    setHunkOriginals(prev => ({ ...prev, [hunk.id]: { oldContent: originalContent, newContent: currentData?.content ?? '' } }));

    const updatedSnapshot = { ...baselineRef.current, [path]: updatedBaseline };
    setBaselineSnapshot(updatedSnapshot);
    baselineRef.current = updatedSnapshot;
    saveSessionData('baselineSnapshot', updatedSnapshot);

    if (dirHandle) {
      scanFiles(dirHandle, updatedSnapshot);
    }
  };

  const handleRejectHunk = async (path: string, hunk: DiffHunkBlock) => {
    if (!dirHandle) return;
    const currentContent = currentFiles.get(path)?.content ?? '';
    const restoredContent = applyRejectHunk(currentContent, hunk);

    const { additions, deletions } = calculateLineChanges(baselineRef.current[path] ?? '', currentContent);
    const newRejectedMap = {
      ...rejectedFilesRef.current,
      [path]: {
        originalBaseline: baselineRef.current[path] ?? '',
        rejectedDiskContent: currentContent,
        additions,
        deletions
      }
    };
    setRejectedFiles(newRejectedMap);
    rejectedFilesRef.current = newRejectedMap;
    saveSessionData('rejectedFiles', newRejectedMap);

    setHunkActions(prev => ({ ...prev, [hunk.id]: 'reject' }));
    setHunkOriginals(prev => ({ ...prev, [hunk.id]: { oldContent: baselineRef.current[path] ?? '', newContent: currentContent } }));

    try {
      const fileHandle = await getFileHandleFromPath(dirHandle, path, true);
      await writeToFile(fileHandle, restoredContent);
      await scanFiles(dirHandle, baselineRef.current);
    } catch {
    }
  };

  const handleUndoHunk = async (path: string, hunk: DiffHunkBlock) => {
    const action = hunkActions[hunk.id];
    const orig = hunkOriginals[hunk.id];
    if (!action || !orig) return;

    if (action === 'accept') {
      const updatedSnapshot = { ...baselineRef.current, [path]: orig.oldContent };
      setBaselineSnapshot(updatedSnapshot);
      baselineRef.current = updatedSnapshot;
      saveSessionData('baselineSnapshot', updatedSnapshot);

      setHunkActions(prev => {
        const next = { ...prev };
        delete next[hunk.id];
        return next;
      });

      if (dirHandle) {
        scanFiles(dirHandle, updatedSnapshot);
      }
    } else if (action === 'reject') {
      if (!dirHandle) return;
      try {
        const fileHandle = await getFileHandleFromPath(dirHandle, path, true);
        await writeToFile(fileHandle, orig.newContent);

        setHunkActions(prev => {
          const next = { ...prev };
          delete next[hunk.id];
          return next;
        });

        await scanFiles(dirHandle, baselineRef.current);
      } catch {
      }
    }
  };

  useEffect(() => {
    if (!isTracking || !dirHandle) return;

    const intervalId = setInterval(() => {
      if (dirHandleRef.current && !isScanningRef.current) {
        scanFiles(dirHandleRef.current, baselineRef.current);
      }
    }, 300);

    const onImmediateScan = () => {
      if (dirHandleRef.current && !isScanningRef.current) {
        scanFiles(dirHandleRef.current, baselineRef.current);
      }
    };

    window.addEventListener('focus', onImmediateScan);
    document.addEventListener('visibilitychange', onImmediateScan);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', onImmediateScan);
      document.removeEventListener('visibilitychange', onImmediateScan);
    };
  }, [isTracking, dirHandle, scanFiles]);

  const handleSelectFile = (path: string) => {
    setSelectedPath(path);
    saveSessionData('selectedPath', path);
  };

  const handleManualScan = () => {
    if (dirHandle) scanFiles(dirHandle, baselineRef.current);
  };

  return {
    isSupported,
    isInitializing,
    dirHandle,
    folderName,
    savedHandle,
    savedFolderName,
    isTracking,
    isScanning,
    inlineDiff,
    setInlineDiff,
    diffMode,
    setDiffMode,
    theme,
    setTheme,
    codeFontSize,
    setCodeFontSize,
    currentFiles,
    diffItems,
    acceptedItems,
    rejectedFiles,
    hunkActions,
    selectedPath,
    handleOpenFolder,
    handleRemoveProject,
    handleReconnect,
    handleToggleTracking,
    handleAcceptFile,
    handleRejectFile,
    handleUndoAction,
    handleAcceptHunk,
    handleRejectHunk,
    handleUndoHunk,
    handleSelectFile,
    handleManualScan
  };
}
