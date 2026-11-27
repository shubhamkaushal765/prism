#!/usr/bin/env node
// Confirms package.json, plugin.json and marketplace.json declare the same prism version.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Reads and parses a JSON manifest, naming the file if it cannot be read.
 * @param {string} file absolute path
 * @returns {any}
 */
function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read ${file}: ${error.message}`);
  }
}

/**
 * Returns the version of the marketplace entry named prism, or undefined when there is none.
 * @param {{ plugins?: Array<{ name: string, version?: string }> }} marketplace
 */
function marketplaceVersion(marketplace) {
  const entry = marketplace.plugins?.find((plugin) => plugin.name === 'prism');
  return entry?.version;
}

/**
 * Compares the three manifest versions under root.
 * @param {string[]} argv arguments after the script name; the first one, if given, is the root
 * @returns {number} 0 when all agree, 1 on mismatch
 */
function main(argv) {
  const root = path.resolve(argv[0] ?? DEFAULT_ROOT);
  const versions = {
    'package.json': readJson(path.join(root, 'package.json')).version,
    'plugin.json': readJson(path.join(root, '.claude-plugin', 'plugin.json')).version,
    'marketplace.json': marketplaceVersion(readJson(path.join(root, '.claude-plugin', 'marketplace.json'))),
  };
  const values = Object.values(versions);
  if (values.every((version) => typeof version === 'string' && version === values[0])) {
    console.log(`versions in sync: ${values[0]}`);
    return 0;
  }
  console.error(
    `version mismatch: package.json=${versions['package.json']} ` +
      `plugin.json=${versions['plugin.json']} marketplace.json=${versions['marketplace.json']}`,
  );
  return 1;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
