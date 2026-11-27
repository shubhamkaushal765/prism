import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/check-versions.mjs', import.meta.url));

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-versions-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function writeManifests({ pkg, plugin, market }) {
  fs.mkdirSync(path.join(root, '.claude-plugin'));
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ name: '@shubhamkaushal765/prism', version: pkg }, null, 2),
  );
  fs.writeFileSync(
    path.join(root, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'prism', version: plugin }, null, 2),
  );
  fs.writeFileSync(
    path.join(root, '.claude-plugin', 'marketplace.json'),
    JSON.stringify({ name: 'prism', plugins: [{ name: 'prism', source: './', version: market }] }, null, 2),
  );
}

function run(args, cwd = root) {
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });
}

describe('check-versions', () => {
  it('prints the shared version and exits 0 when all manifests agree', () => {
    writeManifests({ pkg: '1.2.3', plugin: '1.2.3', market: '1.2.3' });
    const result = run([root]);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'versions in sync: 1.2.3');
  });

  it('exits 1 and names each version on mismatch', () => {
    writeManifests({ pkg: '1.2.3', plugin: '1.2.4', market: '1.2.3' });
    const result = run([root]);
    assert.equal(result.status, 1);
    assert.match(
      result.stderr,
      /^version mismatch: package\.json=1\.2\.3 plugin\.json=1\.2\.4 marketplace\.json=1\.2\.3/,
    );
  });

  it('defaults to the real repo root when no argument is given, regardless of cwd', () => {
    const result = spawnSync(process.execPath, [SCRIPT], { cwd: os.tmpdir(), encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
  });
});
