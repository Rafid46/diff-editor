import { isBinaryFile } from './utils';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  '.turbo',
  'coverage',
  '.cache',
  '.idea',
  '.vscode',
  '__pycache__',
  '.venv',
  'venv'
]);

const IGNORED_FILES = new Set([
  '.DS_Store',
  'Thumbs.db'
]);

interface CachedFileEntry {
  lastModified: number;
  size: number;
  content: string;
  handle: FileSystemFileHandle;
  isBinary: boolean;
}

const fileCache = new Map<string, CachedFileEntry>();

export function clearFileSystemCache() {
  fileCache.clear();
}

export async function readDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle,
  basePath = ''
): Promise<Map<string, { content: string; handle: FileSystemFileHandle; isBinary: boolean }>> {
  const files = new Map<string, { content: string; handle: FileSystemFileHandle; isBinary: boolean }>();

  for await (const [name, handle] of dirHandle.entries()) {
    const currentPath = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === 'directory') {
      if (IGNORED_DIRECTORIES.has(name) || name.startsWith('.git')) {
        continue;
      }
      const subFiles = await readDirectoryRecursive(handle as FileSystemDirectoryHandle, currentPath);
      for (const [subPath, val] of subFiles.entries()) {
        files.set(subPath, val);
      }
    } else if (handle.kind === 'file') {
      if (IGNORED_FILES.has(name)) {
        continue;
      }

      const fileHandle = handle as FileSystemFileHandle;
      const isBinary = isBinaryFile(name);

      if (isBinary) {
        files.set(currentPath, {
          content: '',
          handle: fileHandle,
          isBinary: true
        });
      } else {
        try {
          const file = await fileHandle.getFile();
          const cached = fileCache.get(currentPath);

          if (cached && cached.lastModified === file.lastModified && cached.size === file.size) {
            files.set(currentPath, {
              content: cached.content,
              handle: fileHandle,
              isBinary: false
            });
          } else {
            const text = await file.text();
            fileCache.set(currentPath, {
              lastModified: file.lastModified,
              size: file.size,
              content: text,
              handle: fileHandle,
              isBinary: false
            });
            files.set(currentPath, {
              content: text,
              handle: fileHandle,
              isBinary: false
            });
          }
        } catch {
          files.set(currentPath, {
            content: '',
            handle: fileHandle,
            isBinary: true
          });
        }
      }
    }
  }

  return files;
}

export async function writeToFile(
  fileHandle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function getFileHandleFromPath(
  rootDirHandle: FileSystemDirectoryHandle,
  relativePath: string,
  createIfMissing = false
): Promise<FileSystemFileHandle> {
  const parts = relativePath.split('/');
  let currentDir = rootDirHandle;

  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i], { create: createIfMissing });
  }

  return await currentDir.getFileHandle(parts[parts.length - 1], { create: createIfMissing });
}

export async function deleteFileByPath(
  rootDirHandle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<void> {
  const parts = relativePath.split('/');
  let currentDir = rootDirHandle;

  for (let i = 0; i < parts.length - 1; i++) {
    currentDir = await currentDir.getDirectoryHandle(parts[i]);
  }

  await currentDir.removeEntry(parts[parts.length - 1]);
}
