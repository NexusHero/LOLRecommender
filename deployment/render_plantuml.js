#!/usr/bin/env node
/**
 * Preprocessor for docs/main.md:
 *  1. Resolves <!-- @include: path --> directives
 *  2. Rewrites ../umls/ image paths to /docs/umls/ so md-to-pdf
 *     can resolve them via --basedir (project root)
 *
 * Usage: node deployment/render_plantuml.js <input.md> [output.md]
 */
const fs = require('fs');
const path = require('path');

function resolveIncludes(content, baseDir) {
  return content.replace(
    /<!-- @include: ([^\s>]+) -->/g,
    (_, relPath) => fs.readFileSync(path.resolve(baseDir, relPath), 'utf8')
  );
}

function rewriteImagePaths(content) {
  return content.replace(/\]\(\.\.\/umls\//g, '](/docs/umls/');
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  console.error('Usage: node render_plantuml.js <input.md> [output.md]');
  process.exit(1);
}

let content = fs.readFileSync(inputPath, 'utf8');
content = resolveIncludes(content, path.dirname(path.resolve(inputPath)));
content = rewriteImagePaths(content);

if (outputPath) {
  fs.writeFileSync(outputPath, content, 'utf8');
} else {
  process.stdout.write(content);
}
