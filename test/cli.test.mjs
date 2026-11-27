import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../cli/prism.mjs', import.meta.url));
const SOURCE_SKILL_MD = fileURLToPath(new URL('../skills/prism/SKILL.md', import.meta.url));

let tmp;
let home;
let project;

beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-cli-'));
  home = path.join(tmp, 'home');
  project = path.join(tmp, 'project');
  fs.mkdirSync(home);
  fs.mkdirSync(project);
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

function prism(args) {
  const env = { ...process.env, HOME: home, USERPROFILE: home };
  return spawnSync(process.execPath, [CLI, ...args], { cwd: project, env, encoding: 'utf8' });
}

function installForClaude() {
  const result = prism(['install', '--agent', 'claude-code']);
  assert.equal(result.status, 0, result.stderr);
}

function readSourceSkill() {
  assert.ok(fs.existsSync(SOURCE_SKILL_MD), `source skill missing: ${SOURCE_SKILL_MD}`);
  return fs.readFileSync(SOURCE_SKILL_MD, 'utf8');
}

describe('install', () => {
  it('installs into the project for claude-code', () => {
    const result = prism(['install', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(project, '.claude', 'skills', 'prism', 'SKILL.md')));
  });

  it('installs globally under HOME for cursor', () => {
    const result = prism(['install', '--global', '--agent', 'cursor']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(home, '.cursor', 'skills', 'prism', 'SKILL.md')));
  });

  it('detects codex from HOME when no agent is given and installs to .agents/skills', () => {
    fs.mkdirSync(path.join(home, '.codex'));
    const result = prism(['install']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(project, '.agents', 'skills', 'prism', 'SKILL.md')));
    assert.ok(!fs.existsSync(path.join(project, '.claude', 'skills', 'prism')));
  });

  it('falls back to claude-code when no agent is detected', () => {
    const result = prism(['install']);
    assert.equal(result.status, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(project, '.claude', 'skills', 'prism', 'SKILL.md')));
  });
});

describe('uninstall', () => {
  it('removes an installed copy and prints removed', () => {
    installForClaude();
    const result = prism(['uninstall', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /removed /);
    assert.ok(!fs.existsSync(path.join(project, '.claude', 'skills', 'prism')));
  });

  it('prints not installed when the target is missing', () => {
    const result = prism(['uninstall', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /not installed: /);
  });
});

describe('update', () => {
  it('reinstalls and restores a modified SKILL.md', () => {
    const source = readSourceSkill();
    installForClaude();
    const installed = path.join(project, '.claude', 'skills', 'prism', 'SKILL.md');
    fs.writeFileSync(installed, 'tampered\n');

    const result = prism(['update', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /installed prism -> /);
    assert.equal(fs.readFileSync(installed, 'utf8'), source);
  });
});

describe('doctor', () => {
  it('reports not installed for a missing target', () => {
    const result = prism(['doctor', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^claude-code: .*[\\/]\.claude[\\/]skills[\\/]prism not installed$/m);
  });

  it('reports up to date right after install', () => {
    installForClaude();
    const result = prism(['doctor', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^claude-code: .*[\\/]\.claude[\\/]skills[\\/]prism up to date$/m);
  });

  it('reports outdated when the installed SKILL.md differs from the source', () => {
    installForClaude();
    const installed = path.join(project, '.claude', 'skills', 'prism', 'SKILL.md');
    fs.appendFileSync(installed, '\nlocal edit\n');

    const result = prism(['doctor', '--agent', 'claude-code']);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^claude-code: .*[\\/]\.claude[\\/]skills[\\/]prism outdated$/m);
  });
});

describe('usage errors', () => {
  it('rejects an unknown command with exit 1', () => {
    const result = prism(['frobnicate']);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('unknown command: frobnicate'), result.stderr);
  });

  it('rejects an unknown agent with exit 1 and lists the known ids', () => {
    const result = prism(['install', '--agent', 'vim']);
    assert.equal(result.status, 1);
    assert.ok(
      result.stderr.includes('unknown agent: vim (known: claude-code, codex, cursor, opencode)'),
      result.stderr,
    );
  });

  it('rejects an unknown option with exit 1', () => {
    const result = prism(['install', '--bogus']);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes('unknown option: --bogus'), result.stderr);
  });

  it('rejects --global together with --project and installs nothing', () => {
    const result = prism(['install', '--global', '--project', '--agent', 'claude-code']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /--global/);
    assert.match(result.stderr, /--project/);
    assert.ok(!fs.existsSync(path.join(project, '.claude')));
    assert.ok(!fs.existsSync(path.join(home, '.claude')));
  });

  it('prints usage to stderr and exits 1 when no command is given', () => {
    const result = prism([]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /usage/i);
  });

  for (const flag of ['--help', '-h', 'help']) {
    it(`prints usage to stdout and exits 0 for ${flag}`, () => {
      const result = prism([flag]);
      assert.equal(result.status, 0, result.stderr);
      for (const command of ['install', 'uninstall', 'update', 'doctor']) {
        assert.ok(result.stdout.includes(command), `usage does not mention ${command}`);
      }
    });
  }
});
