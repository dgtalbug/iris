import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

function assertSupportedNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    throw new Error(
      `Unsupported Node.js ${process.versions.node}; iris requires ${packageJson.engines.node}. ` +
        'Install a supported Node.js release and retry.',
    );
  }
}

function assertFile(filePath, description) {
  if (!existsSync(filePath)) {
    throw new Error(`Installed CLI did not create ${description}: ${filePath}`);
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  });
}

assertSupportedNode();

const packOutput = run('npm', ['pack', '--json']);
const packInfo = JSON.parse(packOutput);
const tarballName = packInfo[0]?.filename;
const packedFiles = new Set(packInfo[0]?.files?.map((file) => file.path) ?? []);

if (!tarballName) {
  throw new Error('npm pack did not return a tarball filename');
}
for (const requiredPath of ['dist/src/lib/agent-skills.js', 'templates/agents/iris-workspace.md']) {
  if (!packedFiles.has(requiredPath)) {
    throw new Error(`Packed CLI is missing required initialization asset: ${requiredPath}`);
  }
}

const tarballPath = path.join(repoRoot, tarballName);
const tempDir = mkdtempSync(path.join(tmpdir(), 'iris-install-smoke-'));
const installDir = path.join(tempDir, 'install');
const projectDir = path.join(tempDir, 'project');
const irisBinary = process.platform === 'win32' ? 'iris.cmd' : 'iris';

try {
  mkdirSync(installDir);
  mkdirSync(projectDir);
  const repoHelp = run('node', ['dist/src/index.js', '--help']);

  execFileSync('npm', ['install', '--no-audit', '--no-fund', tarballPath], {
    cwd: installDir,
    stdio: 'inherit',
  });

  const binaryPath = path.join(installDir, 'node_modules', '.bin', irisBinary);
  const helpOutput = execFileSync(binaryPath, ['--help'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  if (
    helpOutput !== repoHelp ||
    !/Usage:\s*iris/i.test(helpOutput) ||
    !/Commands:/i.test(helpOutput)
  ) {
    throw new Error('Installed command help does not match the repository CLI interface');
  }

  const offlineRuntimeEnv = {
    ...process.env,
    HTTP_PROXY: 'http://127.0.0.1:1',
    HTTPS_PROXY: 'http://127.0.0.1:1',
    ALL_PROXY: 'http://127.0.0.1:1',
    NO_PROXY: '',
  };
  execFileSync(binaryPath, ['init'], {
    cwd: projectDir,
    stdio: 'inherit',
    env: offlineRuntimeEnv,
  });
  execFileSync(binaryPath, ['init'], {
    cwd: projectDir,
    stdio: 'inherit',
    env: offlineRuntimeEnv,
  });
  execFileSync(binaryPath, ['vendor'], {
    cwd: projectDir,
    stdio: 'inherit',
    env: offlineRuntimeEnv,
  });
  execFileSync(binaryPath, ['bug', 'install-smoke'], { cwd: projectDir, stdio: 'inherit' });
  execFileSync(binaryPath, ['render', 'install-smoke'], { cwd: projectDir, stdio: 'inherit' });

  assertFile(path.join(projectDir, 'iris', 'state.json'), 'the project state');
  assertFile(
    path.join(projectDir, 'iris', 'pages', 'install-smoke', 'data.json'),
    'the draft contract',
  );
  assertFile(
    path.join(projectDir, 'iris', 'pages', 'install-smoke', 'page.html'),
    'the rendered page',
  );
  assertFile(path.join(projectDir, 'iris', 'index.html'), 'the rendered dashboard');
  assertFile(
    path.join(projectDir, 'iris', 'design', 'vendor', 'mermaid.min.js'),
    'the offline Mermaid browser bundle',
  );
  assertFile(
    path.join(projectDir, 'iris', 'design', 'vendor', 'LICENSE.mermaid.txt'),
    'the Mermaid license',
  );
  for (const skillRoot of ['.agents', '.claude', '.github']) {
    assertFile(
      path.join(projectDir, skillRoot, 'skills', 'iris-workspace', 'SKILL.md'),
      `${skillRoot} Iris agent skill`,
    );
  }

  console.log(
    `install smoke passed for ${packageJson.name}@${packageJson.version} on Node.js ${process.versions.node}`,
  );
} finally {
  rmSync(tempDir, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
}
