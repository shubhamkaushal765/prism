import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECK = fileURLToPath(new URL('../skills/prism/scripts/check.mjs', import.meta.url));

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'prism-check-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function validSkillMd(name, description = 'Use when testing the checker.') {
  return `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nBody text.\n`;
}

// Creates <root>/<name>/ (the directory basename is the skill name) and returns its path.
function makeSkill(name, { skillMd = validSkillMd(name), files = {} } = {}) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  if (skillMd !== null) {
    fs.writeFileSync(path.join(dir, 'SKILL.md'), skillMd);
  }
  for (const [relPath, content] of Object.entries(files)) {
    const file = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return dir;
}

function check(...args) {
  return spawnSync(process.execPath, [CHECK, ...args], { cwd: root, encoding: 'utf8' });
}

describe('check: valid skills', () => {
  it('passes a minimal skill with lite and summary lines', () => {
    const dir = makeSkill('minimal-skill');
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^INFO lite: yes$/m);
    assert.match(result.stdout, /^summary: 0 error\(s\), 0 warning\(s\)$/m);
  });

  it('parses a block scalar description without errors', () => {
    const dir = makeSkill('block-skill', {
      skillMd: '---\nname: block-skill\ndescription: >\n  Use when the text is\n  folded across lines.\n---\n\n# Body\n',
    });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR /m);
  });

  it('warns but does not fail when name differs from the directory basename', () => {
    const dir = makeSkill('dir-name', { skillMd: validSkillMd('other-name') });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /^WARN /m);
    assert.doesNotMatch(result.stdout, /^ERROR /m);
  });

  it('warns about a non-portable frontmatter key', () => {
    const dir = makeSkill('portable-skill', {
      skillMd: '---\nname: portable-skill\ndescription: Use when testing.\nauthor: Someone\n---\n\n# Body\n',
    });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /^WARN frontmatter: non-portable key author$/m);
  });
});

describe('check: frontmatter errors', () => {
  it('fails with exit 1 when SKILL.md is missing', () => {
    const dir = makeSkill('empty-skill', { skillMd: null });
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR frontmatter: SKILL\.md not found$/m);
  });

  it('fails with exit 1 when there is no frontmatter block', () => {
    const dir = makeSkill('plain-skill', { skillMd: '# Just a heading\n\nNo frontmatter here.\n' });
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR frontmatter: /m);
  });

  it('fails on a bad name', () => {
    const dir = makeSkill('Bad_Name');
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR frontmatter: /m);
  });

  it('fails when the name contains claude', () => {
    const dir = makeSkill('claude-helper');
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR frontmatter: /m);
  });

  it('fails when the description is longer than 1024 characters', () => {
    const dir = makeSkill('long-skill', { skillMd: validSkillMd('long-skill', 'x'.repeat(1025)) });
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR frontmatter: /m);
  });
});

describe('check: links', () => {
  it('reports a dead relative link in a reference file with the target', () => {
    const dir = makeSkill('links-skill', {
      skillMd: validSkillMd('links-skill') + 'Read [x](references/x.md).\n',
      files: { 'references/x.md': 'See [missing](./nope.md) for more.\n' },
    });
    const result = check(dir);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /^ERROR links: .*\.\/nope\.md/m);
  });

  it('ignores http, mailto and anchor links', () => {
    const dir = makeSkill('external-skill', {
      skillMd:
        validSkillMd('external-skill') +
        'See [site](https://example.com/docs), [mail](mailto:a@example.com), [top](#usage).\n',
    });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /^ERROR links:/m);
  });
});

describe('check: unreferenced files', () => {
  it('warns about a file that nothing references', () => {
    const dir = makeSkill('orphan-skill', { files: { 'scripts/orphan.sh': '#!/bin/sh\necho hi\n' } });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.match(result.stdout, /^WARN unreferenced: scripts\/orphan\.sh$/m);
  });

  it('does not warn about a file that SKILL.md references', () => {
    const dir = makeSkill('used-skill', {
      skillMd: validSkillMd('used-skill') + 'Run [used](scripts/used.sh).\n',
      files: { 'scripts/used.sh': '#!/bin/sh\necho hi\n' },
    });
    const result = check(dir);
    assert.equal(result.status, 0, result.stdout);
    assert.doesNotMatch(result.stdout, /unreferenced: scripts\/used\.sh/);
  });
});

describe('check: lite and size', () => {
  it('reports lite: no when the skill has extra files', () => {
    const dir = makeSkill('extra-skill', {
      skillMd: validSkillMd('extra-skill') + 'Run [helper](scripts/helper.sh).\n',
      files: { 'scripts/helper.sh': '#!/bin/sh\n' },
    });
    const result = check(dir);
    assert.match(result.stdout, /^INFO lite: no$/m);
  });
});

describe('check: usage errors', () => {
  it('exits 2 when no directory argument is given', () => {
    const result = check();
    assert.equal(result.status, 2);
  });

  it('exits 2 and names the path when the directory does not exist', () => {
    const missing = path.join(root, 'does-not-exist');
    const result = check(missing);
    assert.equal(result.status, 2);
    assert.ok(result.stderr.includes('does-not-exist'), result.stderr);
  });
});
