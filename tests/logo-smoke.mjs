import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const styles = readFileSync(join(root, 'assets/css/style.css'), 'utf8');
const expectedLogos = [
  { className: 'nkumba-logo', path: 'images/Nkumba University Logo.png', dimensions: [600, 600] },
  { className: 'university-logo', path: "images/University of N'Djamena Logo.png", dimensions: [853, 854] },
];
const logoRules = styles.match(/img\.university-logo,\s*img\.nkumba-logo\s*\{([^}]*)\}/s);

assert.ok(logoRules, 'Both university logos must share the same image rules');
for (const property of [
  'width: auto;',
  'height: auto;',
  'max-width: 120px;',
  'max-height: 120px;',
  'object-fit: contain;',
  'image-rendering: auto;',
  'justify-self: center;',
  'align-self: center;',
  'transform: none;',
  'filter: none;',
  'opacity: 1;',
  'animation: none;',
  'transition: none;',
]) {
  assert.ok(logoRules[1].includes(property), `Shared logo rules are missing ${property}`);
}

for (const logo of expectedLogos) {
  const markup = new RegExp(`<img class="${logo.className}" src="${logo.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}" alt="[^"]+"([^>]*)>`);
  const match = html.match(markup);
  assert.ok(match, `Missing ${logo.className} markup or incorrect asset path`);
  assert.doesNotMatch(match[1], /\b(?:width|height)=/, `${logo.path} must use its intrinsic dimensions`);
  assert.ok(existsSync(join(root, logo.path)), `Missing logo asset: ${logo.path}`);

  const png = readFileSync(join(root, logo.path));
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], `${logo.path} must be a PNG`);
  assert.deepEqual(
    [png.readUInt32BE(16), png.readUInt32BE(20)],
    logo.dimensions,
    `${logo.path} natural dimensions changed`
  );
}

assert.match(styles, /\.edu-card\s*\{[^}]*display: grid/s, 'Education cards must use a shared grid layout');
assert.match(styles, /grid-template-columns: minmax\(120px, 0\.4fr\) minmax\(0, 1fr\)/);
assert.match(styles, /img\.university-logo,\s*img\.nkumba-logo/);
assert.match(styles, /\.education-grid,[\s\S]*?grid-template-columns: 1fr;/);
assert.match(styles, /\.site-shell\s*\{[^}]*width: min\(1220px, calc\(100% - 32px\)\)/s);

console.log('PASS: both logo assets, natural PNG dimensions, shared sizing/effects, centered grid, and responsive layout.');
