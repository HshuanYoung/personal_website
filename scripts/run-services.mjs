import { spawn } from 'node:child_process';

const mode = process.argv[2];

if (!mode || !['dev', 'start'].includes(mode)) {
  console.error('Usage: node scripts/run-services.mjs <dev|start>');
  process.exit(1);
}

const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const serviceScripts = mode === 'dev'
  ? ['dev:backend', 'dev:frontend']
  : ['start:backend', 'start:frontend'];

const children = [];
let shuttingDown = false;
const useShell = process.platform === 'win32';

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }
    process.exit(exitCode);
  }, 1500).unref();
}

for (const script of serviceScripts) {
  const child = spawn(command, ['run', script], {
    stdio: 'inherit',
    shell: useShell,
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const message = signal
      ? `[${script}] exited from signal ${signal}`
      : `[${script}] exited with code ${code ?? 0}`;
    console.error(message);
    shutdown(code ?? 1);
  });

  child.on('error', (error) => {
    console.error(`[${script}] failed to start`, error);
    shutdown(1);
  });

  children.push(child);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
