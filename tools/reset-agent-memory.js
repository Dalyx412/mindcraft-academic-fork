import { existsSync, readdirSync, rmSync, statSync } from 'fs';
import path from 'path';
import process from 'process';

const args = process.argv.slice(2);

function hasFlag(...names) {
  return names.some((name) => args.includes(name));
}

function readAgentFilters() {
  const agents = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--agent' && args[i + 1]) {
      agents.push(args[i + 1]);
      i += 1;
    } else if (arg.startsWith('--agent=')) {
      agents.push(arg.slice('--agent='.length));
    }
  }
  return agents;
}

function printHelp() {
  console.log(`Usage:
  node tools/reset-agent-memory.js [options]

Options:
  --dry-run, -n          Show what would be removed without deleting files.
  --agent <name>         Reset only one agent. Can be repeated.
  --keep-histories       Keep bots/<agent>/histories.
  --include-action-code  Also remove generated bots/<agent>/action-code.
  --help, -h             Show this help.

Examples:
  npm run reset:memory:dry
  npm run reset:memory
  node tools/reset-agent-memory.js --agent xiaoming --agent xiaohong

Run this after stopping agents and before starting a new task. Running it while
agents are active can let in-memory state write old memory files back to disk.
`);
}

if (hasFlag('--help', '-h')) {
  printHelp();
  process.exit(0);
}

const dryRun = hasFlag('--dry-run', '-n');
const keepHistories = hasFlag('--keep-histories');
const includeActionCode = hasFlag('--include-action-code');
const requestedAgents = readAgentFilters();

const cwd = process.cwd();
const botsDir = path.resolve(cwd, 'bots');

function assertInsideBots(target) {
  const resolved = path.resolve(target);
  const relative = path.relative(botsDir, resolved);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to touch path outside bots/: ${resolved}`);
  }
  return resolved;
}

function removeTarget(target, actions) {
  const resolved = assertInsideBots(target);
  if (!existsSync(resolved)) {
    return;
  }

  actions.push(resolved);
  if (!dryRun) {
    rmSync(resolved, { recursive: true, force: true });
  }
}

if (!existsSync(botsDir) || !statSync(botsDir).isDirectory()) {
  console.error(`No bots directory found at ${botsDir}`);
  process.exit(1);
}

const agentDirs = readdirSync(botsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => requestedAgents.length === 0 || requestedAgents.includes(name));

const missingAgents = requestedAgents.filter((name) => !agentDirs.includes(name));
if (missingAgents.length > 0) {
  console.error(`Unknown agent directory: ${missingAgents.join(', ')}`);
  process.exit(1);
}

const actions = [];

removeTarget(path.join(botsDir, 'shared_task_state.json'), actions);

for (const agentName of agentDirs) {
  const agentDir = path.join(botsDir, agentName);
  removeTarget(path.join(agentDir, 'memory.json'), actions);

  if (!keepHistories) {
    removeTarget(path.join(agentDir, 'histories'), actions);
  }

  if (includeActionCode) {
    removeTarget(path.join(agentDir, 'action-code'), actions);
  }
}

const mode = dryRun ? 'dry run' : 'applied';
console.log(`Agent memory reset ${mode}.`);
console.log('Scope: bots/*/memory.json, bots/*/histories, bots/shared_task_state.json.');
console.log('Use after stopping agents, before starting the next task round.');

if (includeActionCode) {
  console.log('Also included generated bots/*/action-code directories.');
}

if (actions.length === 0) {
  console.log('No memory artifacts found.');
} else {
  for (const target of actions) {
    console.log(`${dryRun ? 'Would remove' : 'Removed'}: ${path.relative(cwd, target)}`);
  }
}

console.log('Kept project settings, profiles, source files, templates, and last_profile.json files.');
