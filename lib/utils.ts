import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const LANGUAGE_EXTENSIONS: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  json: 'json',
  html: 'html',
  css: 'css',
  scss: 'scss',
  md: 'markdown',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  sh: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  env: 'shell'
};

export function getLanguageFromPath(filePath: string): string {
  const parts = filePath.split('.');
  if (parts.length <= 1) return 'plaintext';
  const ext = parts[parts.length - 1].toLowerCase();
  return LANGUAGE_EXTENSIONS[ext] || 'plaintext';
}

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'pdf',
  'zip', 'tar', 'gz', 'mp4', 'webm', 'mp3', 'wav', 'woff',
  'woff2', 'ttf', 'eot', 'exe', 'dll', 'so', 'dylib', 'bin'
]);

export function isBinaryFile(filePath: string): boolean {
  const parts = filePath.split('.');
  if (parts.length <= 1) return false;
  const ext = parts[parts.length - 1].toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export function getSelectedDiffItem(
  diffItems: import('@/types/diff').FileDiffItem[],
  acceptedItems: import('@/types/diff').AcceptedFileItem[],
  currentFiles: Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>,
  selectedPath: string | null
): import('@/types/diff').FileDiffItem | null {
  if (!selectedPath) return null;
  
  const foundDiff = diffItems.find(item => item.path === selectedPath);
  if (foundDiff) return foundDiff;

  const accepted = acceptedItems.find(item => item.path === selectedPath);
  if (!accepted) return null;
  
  const curData = currentFiles.get(accepted.path);
  return {
    path: accepted.path,
    name: accepted.name,
    status: 'modified',
    originalContent: accepted.originalContent,
    currentContent: curData?.content ?? accepted.currentDiskContent,
    additions: 0,
    deletions: 0,
    isBinary: false
  };
}

export function getFileActionState(
  selectedPath: string | null,
  acceptedItems: import('@/types/diff').AcceptedFileItem[],
  rejectedFiles: Record<string, any>
): 'accept' | 'reject' | null {
  if (!selectedPath) return null;
  const isAccepted = acceptedItems.some(i => i.path === selectedPath);
  if (isAccepted) return 'accept';
  const isRejected = Boolean(rejectedFiles[selectedPath]);
  if (isRejected) return 'reject';
  return null;
}

export function calculateTotals(diffItems: import('@/types/diff').FileDiffItem[]) {
  return diffItems.reduce(
    (acc, item) => {
      acc.additions += item.additions;
      acc.deletions += item.deletions;
      return acc;
    },
    { additions: 0, deletions: 0 }
  );
}
