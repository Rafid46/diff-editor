export type FileChangeStatus = 'modified' | 'added' | 'deleted' | 'rejected' | 'unchanged';

export type DiffMode = 'github' | 'antigravity';

export type AntigravityViewMode = 'component' | 'blocks';

export type AppTheme = 'dark' | 'gray' | 'light' | 'antigravity';

export type SidebarTab = 'changed' | 'accepted';

export interface FileDiffItem {
  path: string;
  name: string;
  status: FileChangeStatus;
  originalContent: string;
  currentContent: string;
  additions: number;
  deletions: number;
  handle?: FileSystemFileHandle;
  isBinary?: boolean;
}

export interface AcceptedFileItem {
  path: string;
  name: string;
  type: 'accept';
  originalContent: string;
  currentDiskContent: string;
  timestamp: number;
}

export type SnapshotMap = Record<string, string>;

export interface ScanResult {
  allFiles: Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>;
  diffs: FileDiffItem[];
  totalAdditions: number;
  totalDeletions: number;
}

export interface DiffHunkBlock {
  id: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: Array<{
    type: 'add' | 'delete' | 'normal';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
  }>;
  oldChunkText: string;
  newChunkText: string;
}

export interface NormalCodeLine {
  type: 'normal';
  content: string;
  oldLineNumber: number;
  newLineNumber: number;
}

export interface HunkCodeBlock {
  type: 'hunk';
  hunk: DiffHunkBlock;
  blockIndex: number;
  totalBlocks: number;
}

export type FullCodeItem = NormalCodeLine | HunkCodeBlock;
