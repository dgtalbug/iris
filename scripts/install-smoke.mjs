import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  });
}

const packOutput = run('npm', ['pack', '--json']);
const packInfo = JSON.parse(packOutput);
const tarballName = packInfo[0]?.filename;

if (!tarballName) {
  throw new Error('npm pack did not return a tarball filename');
}

const tarballPath = path.join(repoRoot, tarballName);
const tempDir = mkdtempSync(path.join(tmpdir(), 'iris-install-smoke-'));
const irisBinary = process.platform === 'win32' ? 'iris.cmd' : 'iris';

try {
  execFileSync('npm', ['install', tarballPath], {
    cwd: tempDir,
    stdio: 'inherit',
  });

  const binaryPath = path.join(tempDir, 'node_modules', '.bin', irisBinary);
  const helpOutput = execFileSync(binaryPath, ['--help'], {
    cwd: tempDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  if (!/Usage:\s*iris/i.test(helpOutput) || !/Commands:/i.test(helpOutput)) {
    throw new Error('Command help output did not match the expected CLI interface');
  }

  console.log(`install smoke passed for ${tarballName}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
}
