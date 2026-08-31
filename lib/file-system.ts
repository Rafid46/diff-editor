import { isBinaryFile } from '@/lib/utils';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.idea',
  '.vscode'
]);

interface CachedFile {
  content: string;
  lastModified: number;
}

const fileCache = new Map<string, CachedFile>();

export function clearFileSystemCache(): void {
  fileCache.clear();
}

export async function readDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle,
  currentPath = ''
): Promise<Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>> {
  const result = new Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>();

  async function traverse(dir: FileSystemDirectoryHandle, prefix: string): Promise<void> {
    for await (const entry of dir.values()) {
      const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.kind === 'directory') {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await traverse(entry as FileSystemDirectoryHandle, entryPath);
        }
      } else if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const isBinary = isBinaryFile(entryPath);

        if (isBinary) {
          result.set(entryPath, {
            content: '',
            handle: fileHandle,
            isBinary: true
          });
          continue;
        }

        try {
          const file = await fileHandle.getFile();
          const cached = fileCache.get(entryPath);

          if (cached && cached.lastModified === file.lastModified) {
            result.set(entryPath, {
              content: cached.content,
              handle: fileHandle,
              isBinary: false
            });
          } else {
            const content = await file.text();
            fileCache.set(entryPath, {
              content,
              lastModified: file.lastModified
            });
            result.set(entryPath, {
              content,
              handle: fileHandle,
              isBinary: false
            });
          }
        } catch {
          result.set(entryPath, {
            content: '',
            handle: fileHandle,
            isBinary: true
          });
        }
      }
    }
  }

  await traverse(dirHandle, currentPath);
  return result;
}

export async function getFileHandleFromPath(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string,
  create = false
): Promise<FileSystemFileHandle> {
  const parts = filePath.split('/').filter(Boolean);
  if (parts.length === 0) {
    throw new Error('Invalid path');
  }

  let currentDir = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i], { create });
  }

  return await currentDir.getFileHandle(parts[parts.length - 1], { create });
}

export async function writeToFile(handle: FileSystemFileHandle, content: string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function deleteFileByPath(
  dirHandle: FileSystemDirectoryHandle,
  filePath: string
): Promise<void> {
  const parts = filePath.split('/').filter(Boolean);
  if (parts.length === 0) return;

  let currentDir = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i], { create: false });
  }

  await currentDir.removeEntry(parts[parts.length - 1]);
}
