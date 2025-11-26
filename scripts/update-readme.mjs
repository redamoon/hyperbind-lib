#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function writeFileIfChanged(filePath, newContent) {
  const prev = readFileSafe(filePath);
  if (prev === null) return false;
  if (prev === newContent) return false;
  fs.writeFileSync(filePath, newContent, 'utf8');
  return true;
}

function extractReservedKeys(source) {
  // 粗めの抽出: RESERVED_KEYS 配列内の "..." を全て取得
  const arrayStart = source.indexOf('export const RESERVED_KEYS');
  if (arrayStart === -1) return [];
  const slice = source.slice(arrayStart);
  const openIdx = slice.indexOf('[');
  const closeIdx = slice.indexOf(']\n');
  const arrayBody = slice.slice(openIdx + 1, closeIdx > -1 ? closeIdx : undefined);
  const matches = Array.from(arrayBody.matchAll(/"([^"]+)"/g)).map(m => m[1]);
  const uniq = Array.from(new Set(matches));
  return uniq.sort((a, b) => a.localeCompare(b));
}

function renderReservedKeysMarkdown(keys) {
  if (keys.length === 0) return '\n(該当なし)\n';
  return '\n' + keys.map(k => `- \`${k}\``).join('\n') + '\n';
}

function replaceBetweenMarkers(content, startMarker, endMarker, newInner) {
  const startIdx = content.indexOf(startMarker);
  const endIdx = content.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    // マーカーが無い場合は末尾に追記
    const block = `\n\n${startMarker}${newInner}${endMarker}\n`;
    return content + block;
  }
  const before = content.slice(0, startIdx + startMarker.length);
  const after = content.slice(endIdx);
  return before + newInner + after;
}

function updateRootReadme(reservedKeys) {
  const readmePath = path.join(repoRoot, 'README.md');
  const content = readFileSafe(readmePath);
  if (content === null) return false;
  const start = '<!-- AUTO:RESERVED_KEYS_START -->\n';
  const end = '\n<!-- AUTO:RESERVED_KEYS_END -->';
  const md = renderReservedKeysMarkdown(reservedKeys);
  const updated = replaceBetweenMarkers(content, start, end, md);
  return writeFileIfChanged(readmePath, updated);
}

function updateExamplesReadme(reservedKeys) {
  const exReadmePath = path.join(repoRoot, 'examples', 'react-demo', 'README.md');
  const content = readFileSafe(exReadmePath);
  if (content === null) return false;
  const start = '<!-- AUTO:RESERVED_KEYS_START -->\n';
  const end = '\n<!-- AUTO:RESERVED_KEYS_END -->';
  const md = renderReservedKeysMarkdown(reservedKeys);
  const updated = replaceBetweenMarkers(content, start, end, md);
  return writeFileIfChanged(exReadmePath, updated);
}

function updateReactPackageReadme(reservedKeys) {
  const reactReadmePath = path.join(repoRoot, 'packages', 'react', 'README.md');
  const content = readFileSafe(reactReadmePath);
  if (content === null) return false;
  const start = '<!-- AUTO:RESERVED_KEYS_START -->\n';
  const end = '\n<!-- AUTO:RESERVED_KEYS_END -->';
  const md = renderReservedKeysMarkdown(reservedKeys);
  const updated = replaceBetweenMarkers(content, start, end, md);
  return writeFileIfChanged(reactReadmePath, updated);
}

function main() {
  const reservedKeysTsPath = path.join(repoRoot, 'packages', 'react', 'src', 'reservedKeys.ts');
  const reservedKeysSrc = readFileSafe(reservedKeysTsPath) ?? '';
  const keys = extractReservedKeys(reservedKeysSrc);

  const changed = [];
  if (updateRootReadme(keys)) changed.push('README.md');
  if (updateExamplesReadme(keys)) changed.push('examples/react-demo/README.md');
  if (updateReactPackageReadme(keys)) changed.push('packages/react/README.md');

  if (changed.length > 0) {
    console.log('Updated files:', changed.join(', '));
  } else {
    console.log('No README updates needed.');
  }
}

main();


