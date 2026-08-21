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
