import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetsMissingFromPayload } from './packaged-assets.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

/**
 * The floor is read out of `engines.node` rather than written here, so this
 * check cannot drift from the one the CLI performs: `src/lib/runtime.ts` holds
 * the same value and a test pins it to `engines.node`.
 */
function assertSupportedNode() {
  const segments = (version) => version.split('.').map((part) => Number.parseInt(part, 10));
  const found = segments(process.versions.node);
  const floor = segments(packageJson.engines.node.replace(/^>=/, ''));

  let supported = true;
  for (let index = 0; index < floor.length; index += 1) {
    const segment = found[index] ?? 0;
    if (segment > floor[index]) break;
    if (segment < floor[index]) {
      supported = false;
      break;
    }
  }
  if (supported) return;

  throw new Error(
    `Unsupported Node.js ${process.versions.node}; iris requires ${packageJson.engines.node}. ` +
      'Install a supported Node.js release and retry.',
  );
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
const missingAssets = assetsMissingFromPayload(packedFiles);
if (missingAssets.length > 0) {
  throw new Error(
    `Packed CLI is missing required initialization assets: ${missingAssets.join(', ')}`,
  );
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
  const versionOutput = execFileSync(binaryPath, ['--version'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  if (versionOutput !== `${packageJson.version}\n`) {
    throw new Error(
      `Installed CLI reported version ${JSON.stringify(versionOutput)}; expected ${packageJson.version}`,
    );
  }

  const helpOutput = execFileSync(binaryPath, ['--help'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

  const { COMMAND_GROUPS } = await import('../dist/src/lib/command-catalog.js');
  const missingCommands = COMMAND_GROUPS.flatMap((group) => group.entries)
    .map((entry) => entry.usage)
    .filter((usage) => !helpOutput.includes(usage));

  if (helpOutput !== repoHelp || !/Usage:\s*iris/i.test(helpOutput) || missingCommands.length > 0) {
    throw new Error(
      `Installed command help does not match the repository CLI interface${
        missingCommands.length > 0 ? `; missing ${missingCommands.join(', ')}` : ''
      }`,
    );
  }

  const offlineRuntimeEnv = {
    ...process.env,
    IRIS_HOME: path.join(tempDir, 'home'),
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

  const irisHome = path.join(tempDir, 'home');
  process.env.IRIS_HOME = irisHome;
  const { resolveProjectIdentity, projectStatePath } =
    await import('../dist/src/lib/user-config.js');
  const smokeIdentity = await resolveProjectIdentity(projectDir);
  assertFile(projectStatePath(smokeIdentity.id), 'the project state');
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
  for (const section of ['work.html', 'spec.html', 'research.html', 'commands.html']) {
    assertFile(path.join(projectDir, 'iris', section), `the generated ${section}`);
  }
  assertFile(
    path.join(projectDir, '.claude', 'commands', 'iris', 'research.md'),
    'the generated Claude research command',
  );
  assertFile(
    path.join(projectDir, '.github', 'prompts', 'iris-research.prompt.md'),
    'the generated Copilot research prompt',
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
