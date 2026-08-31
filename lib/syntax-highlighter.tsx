import React from "react";

const KEYWORDS = new Set([
  "import",
  "export",
  "from",
  "default",
  "function",
  "const",
  "let",
  "var",
  "return",
  "if",
  "else",
  "for",
  "while",
  "switch",
  "case",
  "break",
  "continue",
  "try",
  "catch",
  "finally",
  "class",
  "interface",
  "type",
  "extends",
  "implements",
  "async",
  "await",
  "true",
  "false",
  "null",
  "undefined",
  "new",
  "this",
  "typeof",
  "instanceof",
  "in",
  "of",
  "void",
  "yield",
  "as",
  "readonly",
  "enum",
  "public",
  "private",
  "protected",
  "static",
  "get",
  "set",
  "declare",
  "namespace",
  "def",
  "elif",
  "self",
  "lambda",
  "with",
  "pass",
  "raise",
  "except",
]);

const cache = new Map<string, React.ReactNode>();
const MAX_CACHE_SIZE = 3000;

export function highlightCode(
  code: string,
  language: string = "typescript",
): React.ReactNode {
  if (!code) return " ";

  const cacheKey = `${language}:${code}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const tokens: React.ReactNode[] = [];
  const tokenRegex =
    /(\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|[a-zA-Z_$][a-zA-Z0-9_$]*|\b\d+\b|[{}()[\].,;:?&|^~+*!%<>=/-]+|\s+)/g;

  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = tokenRegex.exec(code)) !== null) {
    const text = match[0];
    const key = `t-${idx++}`;

    if (text.startsWith("//") || text.startsWith("/*")) {
      tokens.push(
        <span key={key} className="text-white/40 italic">
          {text}
        </span>,
      );
    } else if (
      text.startsWith('"') ||
      text.startsWith("'") ||
      text.startsWith("`")
    ) {
      tokens.push(
        <span key={key} className="text-[#a5d6ff]">
          {text}
        </span>,
      );
    } else if (KEYWORDS.has(text)) {
      tokens.push(
        <span key={key} className="text-[#c084fc] font-medium">
          {text}
        </span>,
      );
    } else if (/^\d+$/.test(text)) {
      tokens.push(
        <span key={key} className="text-[#fb923c]">
          {text}
        </span>,
      );
    } else if (/^[A-Z]/.test(text)) {
      tokens.push(
        <span key={key} className="text-[#facc15]">
          {text}
        </span>,
      );
    } else if (/^[{}()[\].,;:?&|^~+*!%<>=/-]+$/.test(text)) {
      tokens.push(
        <span key={key} className="text-white/50">
          {text}
        </span>,
      );
    } else {
      tokens.push(
        <span key={key} className="text-white/90">
          {text}
        </span>,
      );
    }
  }

  const result =
    tokens.length > 0 ? (
      <>{tokens}</>
    ) : (
      <span className="text-white/90">{code}</span>
    );

  if (cache.size >= MAX_CACHE_SIZE) {
    cache.clear();
  }
  cache.set(cacheKey, result);

  return result;
}
