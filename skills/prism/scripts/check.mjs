#!/usr/bin/env node
// Lints a skill directory: SKILL.md frontmatter, size, relative links, unreferenced files.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const KNOWN_KEYS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']);
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LINK_PATTERN = /\[[^\]]*\]\(([^)\s]+)\)/g;

/** Findings in the order they were found, printed at the end. */
const findings = [];

/**
 * @param {'ERROR' | 'WARN' | 'INFO'} level
 * @param {string} check
 * @param {string} message
 */
function add(level, check, message) {
  findings.push({ level, check, message });
}

/**
 * Lists files under dir as posix paths relative to dir, skipping dotfiles and node_modules.
 * @param {string} dir
 * @param {string} [rel] directory being listed, relative to dir
 * @returns {string[]}
 */
function listFiles(dir, rel = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const relPath = rel === '' ? entry.name : `${rel}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...listFiles(dir, relPath));
    } else if (entry.isFile()) {
      files.push(relPath);
    }
  }
  return files;
}

/** Strips one matching pair of surrounding quotes. */
function unquote(value) {
  const quote = value[0];
  const quoted = value.length >= 2 && (quote === '"' || quote === "'") && value.endsWith(quote);
  return quoted ? value.slice(1, -1) : value;
}

/**
 * Joins the indented lines of a block scalar. `>` folds them into one line, `|` keeps newlines.
 * @param {string[]} lines already trimmed
 * @param {string} style `>` or `|`
 */
function joinBlock(lines, style) {
  const kept = lines.filter((line) => line !== '');
  return style === '>' ? kept.join(' ') : kept.join('\n');
}

/**
 * Parses the leading --- block. Returns { fields } or { error } when the block is missing or unclosed.
 * Only top-level `key: value` lines and simple block scalars are understood.
 * @param {string} text
 */
function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0].trim() !== '---') return { error: 'SKILL.md must start with a --- line' };
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  if (end === -1) return { error: 'frontmatter is not closed with a --- line' };

  const body = lines.slice(1, end);
  const fields = {};
  for (let i = 0; i < body.length; i++) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(body[i]);
    if (!match) continue;
    const [, key, raw] = match;
    const value = raw.trim();
    if (/^[>|][+-]?$/.test(value)) {
      const block = [];
      while (i + 1 < body.length && (body[i + 1] === '' || /^\s/.test(body[i + 1]))) {
        i++;
        block.push(body[i].trim());
      }
      fields[key] = joinBlock(block, value[0]);
    } else {
      fields[key] = unquote(value);
    }
  }
  return { fields };
}

/**
 * @param {string | undefined} name
 * @param {string} dirName basename of the skill directory
 */
function checkName(name, dirName) {
  if (!name) {
    add('ERROR', 'frontmatter', 'name is missing');
    return;
  }
  if (!NAME_PATTERN.test(name) || name.length > 64) {
    add('ERROR', 'frontmatter', `name must be lowercase words joined by hyphens, at most 64 characters: ${name}`);
  }
  if (/claude|anthropic/i.test(name)) {
    add('ERROR', 'frontmatter', `name must not contain "claude" or "anthropic": ${name}`);
  }
  if (name !== dirName) {
    add('WARN', 'frontmatter', `name ${name} does not match directory ${dirName}`);
  }
}

/** @param {string | undefined} description */
function checkDescription(description) {
  if (!description) {
    add('ERROR', 'frontmatter', 'description is missing or empty');
    return;
  }
  if (description.length > 1024) {
    add('ERROR', 'frontmatter', `description is ${description.length} characters, the limit is 1024`);
  }
}

/**
 * @param {string} text contents of SKILL.md
 * @param {string} dirName basename of the skill directory
 */
function checkFrontmatter(text, dirName) {
  const parsed = parseFrontmatter(text);
  if (parsed.error) {
    add('ERROR', 'frontmatter', parsed.error);
    return;
  }
  checkName(parsed.fields.name, dirName);
  checkDescription(parsed.fields.description);
  for (const key of Object.keys(parsed.fields)) {
    if (!KNOWN_KEYS.has(key)) add('WARN', 'frontmatter', `non-portable key ${key}`);
  }
}

/**
 * Reports SKILL.md size.
 * @param {string} text
 * @returns {number} line count
 */
function checkSize(text) {
  const lines = text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  add('INFO', 'size', `SKILL.md ${lines} lines, ~${Math.ceil(text.length / 4)} tokens`);
  if (lines > 500) add('WARN', 'size', `SKILL.md has ${lines} lines, more than 500`);
  return lines;
}

/**
 * Returns the file part of a relative link target, or null for external, anchor-only or absolute targets.
 * @param {string} raw target as written in the link
 */
function relativeTarget(raw) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) return null;
  const target = raw.split('#')[0].split('?')[0];
  if (target === '' || path.isAbsolute(target)) return null;
  return target;
}

/**
 * Checks that every relative markdown link in every .md file resolves to an existing file.
 * @param {string} dir skill directory
 * @param {string[]} files posix paths relative to dir
 */
function checkLinks(dir, files) {
  for (const rel of files.filter((file) => file.endsWith('.md'))) {
    const lines = fs.readFileSync(path.join(dir, rel), 'utf8').split('\n');
    lines.forEach((line, index) => {
      for (const match of line.matchAll(LINK_PATTERN)) {
        const target = relativeTarget(match[1]);
        if (target === null) continue;
        if (!fs.existsSync(path.resolve(dir, path.dirname(rel), target))) {
          add('ERROR', 'links', `${rel}:${index + 1} -> ${target} not found`);
        }
      }
    });
  }
}

/**
 * Warns about files (other than SKILL.md) whose path and basename appear in no other file.
 * @param {string} dir skill directory
 * @param {string[]} files posix paths relative to dir
 */
function checkUnreferenced(dir, files) {
  const texts = new Map(files.map((rel) => [rel, fs.readFileSync(path.join(dir, rel), 'utf8')]));
  for (const rel of files) {
    if (rel === 'SKILL.md') continue;
    const base = path.posix.basename(rel);
    const referenced = files.some((other) => {
      if (other === rel) return false;
      const text = texts.get(other);
      return text.includes(rel) || text.includes(base);
    });
    if (!referenced) add('WARN', 'unreferenced', rel);
  }
}

/**
 * Prints each finding, then the summary line. Returns the exit code.
 * @returns {number}
 */
function report() {
  let errors = 0;
  let warnings = 0;
  for (const finding of findings) {
    console.log(`${finding.level} ${finding.check}: ${finding.message}`);
    if (finding.level === 'ERROR') errors++;
    if (finding.level === 'WARN') warnings++;
  }
  console.log(`summary: ${errors} error(s), ${warnings} warning(s)`);
  return errors > 0 ? 1 : 0;
}

/**
 * @param {string[]} argv
 * @returns {number} exit code: 0 clean, 1 errors found, 2 usage error
 */
function main(argv) {
  const arg = argv[0];
  if (arg === undefined) {
    console.error('usage: node check.mjs <skillDir>');
    return 2;
  }
  const dir = path.resolve(arg);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`skill directory not found: ${arg}`);
    return 2;
  }

  const files = listFiles(dir);
  const skillMd = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(skillMd)) {
    add('ERROR', 'frontmatter', 'SKILL.md not found');
  } else {
    const text = fs.readFileSync(skillMd, 'utf8');
    checkFrontmatter(text, path.basename(dir));
    const lines = checkSize(text);
    const otherFiles = files.filter((file) => file !== 'SKILL.md');
    const lite = lines < 100 && otherFiles.length === 0;
    add('INFO', 'lite', lite ? 'yes' : 'no');
  }

  checkLinks(dir, files);
  checkUnreferenced(dir, files);
  return report();
}

process.exitCode = main(process.argv.slice(2));
