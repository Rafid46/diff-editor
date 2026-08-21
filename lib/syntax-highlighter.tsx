import React from 'react';

const KEYWORDS = new Set([
  'import', 'export', 'from', 'default', 'function', 'const', 'let', 'var',
  'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
  'try', 'catch', 'finally', 'class', 'interface', 'type', 'extends', 'implements',
  'async', 'await', 'true', 'false', 'null', 'undefined', 'new', 'this',
  'typeof', 'instanceof', 'in', 'of', 'void', 'yield', 'as', 'readonly', 'enum',
  'public', 'private', 'protected', 'static', 'get', 'set', 'declare', 'namespace',
  'def', 'elif', 'self', 'lambda', 'with', 'pass', 'raise', 'except'
]);

export function highlightCode(code: string, language: string = 'typescript'): React.ReactNode[] {
  if (!code) return [' '];

  const tokens: React.ReactNode[] = [];
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|<\/?[a-zA-Z0-9_$-]+|\/?>|=>|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*=)|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|\b[0-9]+(?:\.[0-9]+)?\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*\b|[{}()[\].,;:?&|^~+*!%<>=/-]+|[^\s{}()[\].,;:?&|^~+*!%<>=/-]+|\s+)/g;

  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    const text = match[0];
    const key = `tok-${idx++}`;

    if (text.startsWith('//') || text.startsWith('/*')) {
      tokens.push(<span key={key} className="text-white/40 italic">{text}</span>);
    } else if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
      tokens.push(<span key={key} className="text-[#a5d6ff]">{text}</span>);
    } else if (text.startsWith('</') || text.startsWith('<')) {
      tokens.push(<span key={key} className="text-[#7dd3fc]">{text}</span>);
    } else if (text === '/>' || text === '>') {
      tokens.push(<span key={key} className="text-[#7dd3fc]">{text}</span>);
    } else if (KEYWORDS.has(text)) {
      tokens.push(<span key={key} className="text-[#c084fc] font-medium">{text}</span>);
    } else if (/^[0-9]+(\.[0-9]+)?$/.test(text)) {
      tokens.push(<span key={key} className="text-[#fb923c]">{text}</span>);
    } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(text)) {
      tokens.push(<span key={key} className="text-[#facc15]">{text}</span>);
    } else if (code[match.index + text.length] === '=') {
      tokens.push(<span key={key} className="text-[#fde047]">{text}</span>);
    } else if (code[match.index + text.length] === '(') {
      tokens.push(<span key={key} className="text-[#60a5fa]">{text}</span>);
    } else if (/^[{}()[\].,;:?&|^~+*!%<>=/-]+$/.test(text)) {
      tokens.push(<span key={key} className="text-white/50">{text}</span>);
    } else {
      tokens.push(<span key={key} className="text-white/70">{text}</span>);
    }
  }

  return tokens.length > 0 ? tokens : [code];
}
