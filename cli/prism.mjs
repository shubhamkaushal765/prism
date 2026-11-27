#!/usr/bin/env node
// prism CLI: copies the prism skill into each agent's skills directory.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SOURCE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'skills', 'prism');
const COMMANDS = ['install', 'uninstall', 'update', 'doctor'];

// marker: directory under the home dir that shows the agent is installed.
const AGENTS = {
  'claude-code': { project: '.claude/skills', global: '.claude/skills', marker: '.claude' },
  codex: { project: '.agents/skills', global: '.agents/skills', marker: '.codex' },
  cursor: { project: '.agents/skills', global: '.cursor/skills', marker: '.cursor' },
  opencode: { project: '.agents/skills', global: '.config/opencode/skills', marker: '.config/opencode' },
};

const USAGE = `usage: prism <command> [--global | --project] [--agent <id>]...

commands:
  install     copy the prism skill into the agent skills directories
  uninstall   remove the prism skill from those directories
  update      reinstall the prism skill from this package
  doctor      report whether each installed copy matches this package

options:
  --global        use the home directory instead of the current project
  --project       use the current project (default)
  --agent <id>    target one agent: ${Object.keys(AGENTS).join(', ')} (repeatable)
  -h, --help      show this help
`;

/**
 * Reads the command line. Throws an Error with a user-facing message on bad input.
 * @param {string[]} argv arguments after the script name
 * @returns {{ command?: string, scope?: 'project' | 'global', agents: string[], help: boolean }}
 */
function parseArgs(argv) {
  const parsed = { command: undefined, scope: undefined, agents: [], help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--global' || arg === '--project') {
      const scope = arg.slice(2);
      if (parsed.scope !== undefined && parsed.scope !== scope) {
        throw new Error('--global and --project cannot be used together');
      }
      parsed.scope = scope;
    } else if (arg === '--agent') {
      const id = argv[++i];
      if (id === undefined || id.startsWith('-')) throw new Error('--agent needs an agent id');
      if (!Object.hasOwn(AGENTS, id)) {
        throw new Error(`unknown agent: ${id} (known: ${Object.keys(AGENTS).join(', ')})`);
      }
      parsed.agents.push(id);
    } else if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown option: ${arg}`);
    } else if (parsed.command === undefined) {
      parsed.command = arg;
    } else {
      throw new Error(`unexpected argument: ${arg}`);
    }
  }
  return parsed;
}

/**
 * Picks the agent ids to act on: the ones given, else the ones whose marker dir exists, else claude-code.
 * @param {string[]} requested
 * @returns {string[]}
 */
function selectAgents(requested) {
  if (requested.length > 0) return [...new Set(requested)];
  const detected = Object.keys(AGENTS).filter((id) =>
    fs.existsSync(path.join(os.homedir(), AGENTS[id].marker)),
  );
  return detected.length > 0 ? detected : ['claude-code'];
}

/**
 * Maps each prism target directory to the agent ids that share it.
 * @param {string[]} agentIds
 * @param {'project' | 'global'} scope
 * @returns {Map<string, string[]>}
 */
function planTargets(agentIds, scope) {
  const base = scope === 'global' ? os.homedir() : process.cwd();
  const targets = new Map();
  for (const id of agentIds) {
    const skillsDir = scope === 'global' ? AGENTS[id].global : AGENTS[id].project;
    const target = path.join(base, skillsDir, 'prism');
    targets.set(target, [...(targets.get(target) ?? []), id]);
  }
  return targets;
}

/**
 * Replaces the target with a fresh copy of the skill. The copy is built beside the target first,
 * so a failed copy leaves the existing install in place.
 */
function install(target) {
  const staging = `${target}.tmp-${process.pid}`;
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(target), { recursive: true });
  try {
    fs.cpSync(SOURCE, staging, { recursive: true, force: true });
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
  fs.rmSync(target, { recursive: true, force: true });
  fs.renameSync(staging, target);
  console.log(`installed prism -> ${target}`);
}

/** Removes the target if present. */
function uninstall(target) {
  if (!fs.existsSync(target)) {
    console.log(`not installed: ${target}`);
    return;
  }
  fs.rmSync(target, { recursive: true, force: true });
  console.log(`removed ${target}`);
}

/**
 * Compares the installed SKILL.md with the packaged one, byte for byte.
 * @returns {'not installed' | 'outdated' | 'up to date'}
 */
function doctorStatus(target) {
  if (!fs.existsSync(target)) return 'not installed';
  const installed = path.join(target, 'SKILL.md');
  if (!fs.existsSync(installed)) return 'outdated';
  const same = fs.readFileSync(installed).equals(fs.readFileSync(path.join(SOURCE, 'SKILL.md')));
  return same ? 'up to date' : 'outdated';
}

/**
 * Runs one command against every target. Returns the process exit code.
 * @returns {number}
 */
function main(argv) {
  let parsed;
  try {
    parsed = parseArgs(argv);
  } catch (error) {
    console.error(error.message);
    return 1;
  }
  if (parsed.help || parsed.command === 'help') {
    console.log(USAGE);
    return 0;
  }
  if (parsed.command === undefined) {
    console.error(USAGE);
    return 1;
  }
  if (!COMMANDS.includes(parsed.command)) {
    console.error(`unknown command: ${parsed.command}\n${USAGE}`);
    return 1;
  }

  if (!fs.existsSync(path.join(SOURCE, 'SKILL.md'))) {
    console.error(`packaged skill not found: ${SOURCE}`);
    return 1;
  }

  try {
    const agentIds = selectAgents(parsed.agents);
    const targets = planTargets(agentIds, parsed.scope ?? 'project');
    for (const [target, ids] of targets) {
      if (parsed.command === 'install' || parsed.command === 'update') {
        install(target);
      } else if (parsed.command === 'uninstall') {
        uninstall(target);
      } else {
        console.log(`${ids.join(',')}: ${target} ${doctorStatus(target)}`);
      }
    }
  } catch (error) {
    console.error(`prism: ${parsed.command} failed: ${error.message}`);
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
