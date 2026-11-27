import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../cli/prism.mjs', import.meta.url));
const CHECK = fileURLToPath(new URL('../skills/prism/scripts/check.mjs', import.meta.url));
const VERSIONS = fileURLToPath(new URL('../scripts/check-versions.mjs', import.meta.url));
const SOURCE_SKILL_MD = fileURLToPath(new URL('../skills/prism/SKILL.md', import.meta.url));

describe('regressions: cli', () => {
  let tmp;
  let home;
  let project;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-cli-regress-'));
    home = path.join(tmp, 'home');
    project = path.join(tmp, 'project');
    fs.mkdirSync(home);
    fs.mkdirSync(project);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  function prism(args, script = CLI) {
    const env = { ...process.env, HOME: home, USERPROFILE: home };
    return spawnSync(process.execPath, [script, ...args], { cwd: project, env, encoding: 'utf8' });
  }

  it('install replaces a stale copy with the packaged skill and leaves no staging dir', () => {
    const target = path.join(project, '.claude', 'skills', 'prism');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'stale.txt'), 'old\n');
    fs.writeFileSync(path.join(target, 'SKILL.md'), 'old\n');

    const result = prism(['install', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(!fs.existsSync(path.join(target, 'stale.txt')));
    assert.equal(fs.readFileSync(path.join(target, 'SKILL.md'), 'utf8'), fs.readFileSync(SOURCE_SKILL_MD, 'utf8'));
    assert.deepEqual(fs.readdirSync(path.dirname(target)), ['prism']);
  });

  it('reports a missing packaged skill with exit 1', () => {
    const copy = path.join(tmp, 'copy');
    fs.mkdirSync(path.join(copy, 'cli'), { recursive: true });
    fs.copyFileSync(CLI, path.join(copy, 'cli', 'prism.mjs'));

    const result = prism(['install', '--agent', 'claude-code'], path.join(copy, 'cli', 'prism.mjs'));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^packaged skill not found: /m);
  });

  it('reports a failed install as a message with exit 1, not a stack trace', () => {
    fs.writeFileSync(path.join(project, '.claude'), 'a regular file, not a directory\n');

    const result = prism(['install', '--agent', 'claude-code']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^prism: install failed: /);
    assert.doesNotMatch(result.stderr, /^\s+at /m);
  });

  for (const id of ['constructor', '__proto__', 'toString']) {
    it(`rejects the inherited key ${id} as an agent id`, () => {
      const result = prism(['install', '--agent', id]);
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(`unknown agent: ${id}`), result.stderr);
    });
  }
});

describe('regressions: check', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-check-regress-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  function skillMd(name, body = '') {
    return `---\nname: ${name}\ndescription: Use when testing the checker.\n---\n\n# ${name}\n\n${body}`;
  }

  // Creates <root>/<name>/ with the given SKILL.md text and extra files; returns the directory.
  function makeSkill(name, text, files = {}) {
    const dir = path.join(root, name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'SKILL.md'), text);
    for (const [relPath, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, relPath), content);
    }
    return dir;
  }

  function check(dir) {
    return spawnSync(process.execPath, [CHECK, dir], { cwd: root, encoding: 'utf8' });
  }

  it('accepts a SKILL.md with CRLF line endings', () => {
    const text = '---\r\nname: crlf-skill\r\ndescription: Use when testing CRLF.\r\n---\r\n\r\n# Body\r\n';
    const result = check(makeSkill('crlf-skill', text));
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR /m);
  });

  it('accepts a SKILL.md that starts with a UTF-8 BOM', () => {
    const text = '﻿' + skillMd('bom-skill');
    const result = check(makeSkill('bom-skill', text));
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR /m);
  });

  it('drops an inline YAML comment from a bare name', () => {
    const text = '---\nname: bare-name # short id\ndescription: Use when testing.\n---\n\n# Body\n';
    const result = check(makeSkill('bare-name', text));
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR /m);
  });

  it('reports a crash such as an unreadable SKILL.md as check failed with exit 2', () => {
    const dir = path.join(root, 'dir-skill');
    fs.mkdirSync(path.join(dir, 'SKILL.md'), { recursive: true });
    const result = check(dir);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /^check failed: /m);
  });

  it('flags a link with a title that points at a missing file', () => {
    const dir = makeSkill('titled-skill', skillMd('titled-skill', 'See [x](missing.md "a title").\n'));
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR links: .* -> missing\.md not found$/m);
  });

  it('flags an angle-bracket link to a missing file, without the brackets in the target', () => {
    const dir = makeSkill('bracket-skill', skillMd('bracket-skill', 'See [x](<missing.md>).\n'));
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR links: .* -> missing\.md not found$/m);
  });

  it('accepts an angle-bracket link to an existing file', () => {
    const dir = makeSkill('bracket-ok', skillMd('bracket-ok', 'See [x](<present.md>).\n'), {
      'present.md': 'here\n',
    });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR links:/m);
  });

  it('accepts a titled link to an existing file', () => {
    const dir = makeSkill('titled-ok', skillMd('titled-ok', 'See [x](present.md "a title").\n'), {
      'present.md': 'here\n',
    });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR links:/m);
  });

  it('ignores links inside backtick and tilde fenced code blocks', () => {
    const body = '```\n[x](missing.md)\n```\n\n~~~\n[y](other.md)\n~~~\n';
    const result = check(makeSkill('fenced-skill', skillMd('fenced-skill', body)));
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR links:/m);
  });
});

describe('regressions: check-versions', () => {
  let root;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-versions-regress-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('treats a missing version as a mismatch instead of reporting undefined as in sync', () => {
    fs.mkdirSync(path.join(root, '.claude-plugin'));
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'prism' }));
    fs.writeFileSync(
      path.join(root, '.claude-plugin', 'plugin.json'),
      JSON.stringify({ name: 'prism', version: '1.2.3' }),
    );
    fs.writeFileSync(
      path.join(root, '.claude-plugin', 'marketplace.json'),
      JSON.stringify({ name: 'prism', plugins: [{ name: 'prism', version: '1.2.3' }] }),
    );

    const result = spawnSync(process.execPath, [VERSIONS, root], { encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^version mismatch: /);
    assert.doesNotMatch(result.stdout, /in sync/);
  });
});
