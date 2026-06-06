#!/usr/bin/env node
/**
 * Preprocessor for docs/main.md:
 *  1. Resolves <!-- @include: path --> directives
 *  2. Encodes ```plantuml blocks as Kroki.io image URLs
 *
 * Usage: node deployment/render_plantuml.js <input.md> [output.md]
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function encodeKroki(source) {
  const compressed = zlib.deflateRawSync(Buffer.from(source, 'utf8'));
  return Buffer.from(compressed)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function resolveIncludes(content, baseDir) {
  return content.replace(
    /<!-- @include: ([^\s>]+) -->/g,
    (_, relPath) => {
      const absPath = path.resolve(baseDir, relPath);
      return fs.readFileSync(absPath, 'utf8');
    }
  );
}

function renderPlantUml(content) {
  return content.replace(
    /```plantuml\n([\s\S]*?)\n```/g,
    (_, src) => {
      const encoded = encodeKroki(src.trim());
      return `![](https://kroki.io/plantuml/svg/${encoded})`;
    }
  );
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath) {
  console.error('Usage: node render_plantuml.js <input.md> [output.md]');
  process.exit(1);
}

let content = fs.readFileSync(inputPath, 'utf8');
content = resolveIncludes(content, path.dirname(path.resolve(inputPath)));
content = renderPlantUml(content);

if (outputPath) {
  fs.writeFileSync(outputPath, content, 'utf8');
} else {
  process.stdout.write(content);
}
