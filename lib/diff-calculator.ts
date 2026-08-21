import { diffLines, structuredPatch } from 'diff';
import { FileDiffItem, SnapshotMap, DiffHunkBlock, FullCodeItem } from '@/types/diff';

export function calculateLineChanges(oldContent: string, newContent: string): { additions: number; deletions: number } {
  if (oldContent === newContent) {
    return { additions: 0, deletions: 0 };
  }

  const changes = diffLines(oldContent, newContent);
  let additions = 0;
  let deletions = 0;

  for (const change of changes) {
    if (change.added) {
      additions += change.count ?? 0;
    } else if (change.removed) {
      deletions += change.count ?? 0;
    }
  }

  return { additions, deletions };
}

export function computeFileDiffs(
  snapshot: SnapshotMap,
  currentFiles: Map<string, { content: string; handle?: FileSystemFileHandle; isBinary?: boolean }>
): FileDiffItem[] {
  const items: FileDiffItem[] = [];
  const processedPaths = new Set<string>();

  for (const [path, data] of currentFiles.entries()) {
    processedPaths.add(path);
    const fileName = path.split('/').pop() || path;

    if (data.isBinary) {
      continue;
    }

    if (!(path in snapshot)) {
      const lineCount = data.content ? data.content.split('\n').length : 0;
      items.push({
        path,
        name: fileName,
        status: 'added',
        originalContent: '',
        currentContent: data.content,
        additions: lineCount,
        deletions: 0,
        handle: data.handle,
        isBinary: false
      });
    } else {
      const originalContent = snapshot[path];
      if (originalContent !== data.content) {
        const { additions, deletions } = calculateLineChanges(originalContent, data.content);
        items.push({
          path,
          name: fileName,
          status: 'modified',
          originalContent,
          currentContent: data.content,
          additions,
          deletions,
          handle: data.handle,
          isBinary: false
        });
      }
    }
  }

  for (const [path, originalContent] of Object.entries(snapshot)) {
    if (!processedPaths.has(path)) {
      const fileName = path.split('/').pop() || path;
      const lineCount = originalContent ? originalContent.split('\n').length : 0;
      items.push({
        path,
        name: fileName,
        status: 'deleted',
        originalContent,
        currentContent: '',
        additions: 0,
        deletions: lineCount,
        isBinary: false
      });
    }
  }

  return items.sort((a, b) => a.path.localeCompare(b.path));
}

export function parseHunks(oldContent: string, newContent: string): DiffHunkBlock[] {
  const patch = structuredPatch('', '', oldContent, newContent, '', '', { context: 3 });
  const hunks: DiffHunkBlock[] = [];

  for (let i = 0; i < patch.hunks.length; i++) {
    const hunk = patch.hunks[i];
    let curOldLine = hunk.oldStart;
    let curNewLine = hunk.newStart;

    const parsedLines: DiffHunkBlock['lines'] = [];
    const oldLinesArray: string[] = [];
    const newLinesArray: string[] = [];

    for (const rawLine of hunk.lines) {
      const marker = rawLine[0];
      const lineText = rawLine.slice(1);

      if (marker === '-') {
        parsedLines.push({
          type: 'delete',
          content: lineText,
          oldLineNumber: curOldLine
        });
        oldLinesArray.push(lineText);
        curOldLine++;
      } else if (marker === '+') {
        parsedLines.push({
          type: 'add',
          content: lineText,
          newLineNumber: curNewLine
        });
        newLinesArray.push(lineText);
        curNewLine++;
      } else {
        parsedLines.push({
          type: 'normal',
          content: lineText,
          oldLineNumber: curOldLine,
          newLineNumber: curNewLine
        });
        oldLinesArray.push(lineText);
        newLinesArray.push(lineText);
        curOldLine++;
        curNewLine++;
      }
    }

    hunks.push({
      id: `hunk-${i}`,
      oldStart: hunk.oldStart,
      oldLines: hunk.oldLines,
      newStart: hunk.newStart,
      newLines: hunk.newLines,
      lines: parsedLines,
      oldChunkText: oldLinesArray.join('\n'),
      newChunkText: newLinesArray.join('\n')
    });
  }

  return hunks;
}

export function parseFullComponentCode(oldContent: string, newContent: string): FullCodeItem[] {
  const oldLines = oldContent ? oldContent.split('\n') : [];
  const newLines = newContent ? newContent.split('\n') : [];

  if (oldLines.length === 0 && newLines.length === 0) {
    return [];
  }

  if (oldLines.length === 0) {
    const hunk: DiffHunkBlock = {
      id: 'hunk-0',
      oldStart: 0,
      oldLines: 0,
      newStart: 1,
      newLines: newLines.length,
      lines: newLines.map((line, idx) => ({
        type: 'add',
        content: line,
        newLineNumber: idx + 1
      })),
      oldChunkText: '',
      newChunkText: newContent
    };
    return [{ type: 'hunk', hunk, blockIndex: 0, totalBlocks: 1 }];
  }

  if (newLines.length === 0) {
    const hunk: DiffHunkBlock = {
      id: 'hunk-0',
      oldStart: 1,
      oldLines: oldLines.length,
      newStart: 0,
      newLines: 0,
      lines: oldLines.map((line, idx) => ({
        type: 'delete',
        content: line,
        oldLineNumber: idx + 1
      })),
      oldChunkText: oldContent,
      newChunkText: ''
    };
    return [{ type: 'hunk', hunk, blockIndex: 0, totalBlocks: 1 }];
  }

  const patch = structuredPatch('', '', oldContent, newContent, '', '', { context: 0 });
  const rawHunks = patch.hunks;
  const items: FullCodeItem[] = [];

  let curOldLine = 1;
  let curNewLine = 1;

  for (let i = 0; i < rawHunks.length; i++) {
    const h = rawHunks[i];
    
    while (curOldLine < h.oldStart) {
      items.push({
        type: 'normal',
        content: oldLines[curOldLine - 1] ?? '',
        oldLineNumber: curOldLine,
        newLineNumber: curNewLine
      });
      curOldLine++;
      curNewLine++;
    }

    const hunkLines: DiffHunkBlock['lines'] = [];
    const oldChunkArr: string[] = [];
    const newChunkArr: string[] = [];

    let hunkOld = h.oldStart;
    let hunkNew = h.newStart;

    for (const rawLine of h.lines) {
      const marker = rawLine[0];
      const text = rawLine.slice(1);

      if (marker === '-') {
        hunkLines.push({
          type: 'delete',
          content: text,
          oldLineNumber: hunkOld
        });
        oldChunkArr.push(text);
        hunkOld++;
      } else if (marker === '+') {
        hunkLines.push({
          type: 'add',
          content: text,
          newLineNumber: hunkNew
        });
        newChunkArr.push(text);
        hunkNew++;
      } else {
        hunkLines.push({
          type: 'normal',
          content: text,
          oldLineNumber: hunkOld,
          newLineNumber: hunkNew
        });
        oldChunkArr.push(text);
        newChunkArr.push(text);
        hunkOld++;
        hunkNew++;
      }
    }

    const block: DiffHunkBlock = {
      id: `hunk-${i}`,
      oldStart: h.oldStart,
      oldLines: h.oldLines,
      newStart: h.newStart,
      newLines: h.newLines,
      lines: hunkLines,
      oldChunkText: oldChunkArr.join('\n'),
      newChunkText: newChunkArr.join('\n')
    };

    items.push({
      type: 'hunk',
      hunk: block,
      blockIndex: i,
      totalBlocks: rawHunks.length
    });

    curOldLine = h.oldStart + h.oldLines;
    curNewLine = h.newStart + h.newLines;
  }

  while (curOldLine <= oldLines.length) {
    items.push({
      type: 'normal',
      content: oldLines[curOldLine - 1] ?? '',
      oldLineNumber: curOldLine,
      newLineNumber: curNewLine
    });
    curOldLine++;
    curNewLine++;
  }

  return items;
}

export function applyRejectHunk(
  currentContent: string,
  hunk: DiffHunkBlock
): string {
  const currentLines = currentContent.split('\n');
  const startIndex = Math.max(0, hunk.newStart - 1);
  const deleteCount = hunk.newLines;
  const originalOldLines = hunk.lines
    .filter(l => l.type === 'normal' || l.type === 'delete')
    .map(l => l.content);

  currentLines.splice(startIndex, deleteCount, ...originalOldLines);
  return currentLines.join('\n');
}

export function applyAcceptHunk(
  originalContent: string,
  hunk: DiffHunkBlock
): string {
  const originalLines = originalContent.split('\n');
  const startIndex = Math.max(0, hunk.oldStart - 1);
  const deleteCount = hunk.oldLines;
  const newLines = hunk.lines
    .filter(l => l.type === 'normal' || l.type === 'add')
    .map(l => l.content);

  originalLines.splice(startIndex, deleteCount, ...newLines);
  return originalLines.join('\n');
}
