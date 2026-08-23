import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, writeIfMissing } from '../lib/fs.js';
import { writeOpenSpecSnapshot } from '../lib/openspec-workspace.js';
import { migrateProjectState } from '../lib/project-migration.js';
import { createProjectState, loadProjectState } from '../lib/project-state.js';
import {
  HOST_ADAPTER_IDS,
  type HostAdapterId,
  detectHosts,
  resolveAdapter,
} from '../lib/host-adapters.js';
import {
  ensureUserConfig,
  migrateMetaToHome,
  projectStatePath,
  registerProject,
  resolveProjectIdentity,
  setUserConfigValue,
} from '../lib/user-config.js';
import { box, createPalette, isInteractive, multiSelect, type Palette } from '../lib/terminal.js';
import { refreshDashboard } from './render.js';
import {
  assertSkillInstallComplete,
  reportProjectDocs,
  updateManagedSurfaces,
  type ManagedSurfaceResult,
} from './lifecycle.js';

export type InitOptions = {
  json?: boolean;
  yes?: boolean;
  interactive?: boolean;
  tools?: string;
  index?: boolean;
  noIndex?: boolean;
};

export type InitResult = {
  hosts: string[];
  surfaces: ManagedSurfaceResult;
  migration: { removed: string[]; preserved: string[] };
  metaMigration: { movedState: boolean; regeneratedSpec: boolean; copiedSpec: boolean };
  userConfigCreated: boolean;
  requiresIdeRestart: string[];
};

const ALL_HOST_IDS: readonly HostAdapterId[] = HOST_ADAPTER_IDS as readonly HostAdapterId[];

function parseToolsFlag(value: string | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed === '') return undefined;
  return trimmed
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function resolveHostSelection(cwd: string, options: InitOptions): string[] {
  const explicit = parseToolsFlag(options.tools);
  if (explicit) {
    if (explicit.length === 1 && explicit[0] === 'none') return [];
    for (const id of explicit) resolveAdapter(id);
    return explicit;
  }
  if (options.yes) {
    return detectHosts(cwd).map((adapter) => adapter.id);
  }
  return [...ALL_HOST_IDS];
}

function welcomeCard(palette: Palette): string {
  return box(['Welcome to Iris.', 'Set up a local visual workspace in this repo.'], {
    palette,
    title: 'iris init',
  });
}

function completionCard(palette: Palette, result: InitResult): string {
  const lines = [
    `Installed surfaces for ${result.hosts.length} host${result.hosts.length === 1 ? '' : 's'}.`,
    'Next: write iris/project/hld.md and iris/project/lld.md, then iris render --all.',
    'Open: iris open',
    ...result.requiresIdeRestart.map((note) => `Note: ${note}`),
  ];
  return box(lines, { palette, title: 'iris ready' });
}

export async function runInitCommand(cwd: string, options: InitOptions = {}): Promise<number> {
  const palette = createPalette();
  const interactive =
    options.interactive === true || (!options.yes && isInteractive() && !options.json);

  if (interactive) process.stdout.write(`${welcomeCard(palette)}\n`);

  const irisRoot = path.join(cwd, 'iris');
  await ensureDir(irisRoot);

  await writeIfMissing(
    path.join(irisRoot, 'config.yaml'),
    [
      `project: ${path.basename(cwd)}`,
      'theme: dark',
      'asset_base: local',
      'budgets:',
      '  text_words_per_block: 120',
    ].join('\n') + '\n',
  );

  const dirs = [
    'design/components',
    'design/vendor',
    'design/gallery',
    'project',
    'pages',
    'research',
    'archive',
  ];
  await Promise.all(dirs.map((dir) => ensureDir(path.join(irisRoot, dir))));

  await writeIfMissing(path.join(irisRoot, 'design/vendor/.gitkeep'), '');
  await writeIfMissing(
    path.join(irisRoot, 'design/vendor/mermaid.min.js'),
    '/* Mermaid runtime not installed. Run `iris vendor` to enable diagram previews. */\n',
  );

  const identity = await resolveProjectIdentity(cwd);
  await registerProject(cwd);
  await ensureDir(path.dirname(projectStatePath(identity.id)));
  await writeIfMissing(
    projectStatePath(identity.id),
    JSON.stringify(createProjectState(), null, 2) + '\n',
  );

  const metaMigration = await migrateMetaToHome(cwd, async (hookCwd) => {
    void hookCwd;
    await writeOpenSpecSnapshot(cwd);
  });

  let selectedHosts = resolveHostSelection(cwd, options);
  if (interactive && options.tools === undefined && !options.yes) {
    selectedHosts = await multiSelect({
      message: 'Select agent hosts to install Iris surfaces for',
      choices: ALL_HOST_IDS.map((id) => ({
        value: id,
        name: resolveAdapter(id).displayName,
        checked: detectHosts(cwd)
          .map((adapter) => adapter.id)
          .includes(id),
      })),
    });
  }

  const { created: userConfigCreated } = await ensureUserConfig();
  if (selectedHosts.length > 0) await setUserConfigValue('tools', selectedHosts);

  const migration = await migrateProjectState(cwd);
  const surfaces = await updateManagedSurfaces(cwd, { hosts: selectedHosts });
  await writeOpenSpecSnapshot(cwd);
  await refreshDashboard(cwd);

  await loadProjectState(cwd);
  await Promise.all([
    readFile(path.join(irisRoot, 'config.yaml'), 'utf8'),
    readFile(path.join(irisRoot, 'index.html'), 'utf8'),
  ]);

  for (const id of migration.removed)
    process.stdout.write(`removed generated adopted page ${id}\n`);
  for (const id of migration.preserved) {
    process.stderr.write(`preserved ambiguous legacy adopted page ${id}; review it manually\n`);
  }
  reportProjectDocs(surfaces);

  const requiresIdeRestart = selectedHosts
    .map((id) => resolveAdapter(id))
    .flatMap((adapter) => (adapter.requiresIdeRestart ? [adapter.requiresIdeRestart] : []));

  const result: InitResult = {
    hosts: selectedHosts,
    surfaces,
    migration,
    metaMigration,
    userConfigCreated,
    requiresIdeRestart,
  };

  if (options.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  }

  const installed =
    surfaces.skills.created.length +
    surfaces.skills.updated.length +
    surfaces.skills.unchanged.length;
  process.stdout.write(
    `agent surfaces: ${installed} installed (${surfaces.skills.created.length} created, ${surfaces.skills.updated.length} updated, ${surfaces.skills.unchanged.length} unchanged)\n`,
  );
  for (const conflict of surfaces.skills.conflicts) {
    process.stderr.write(`agent surface not written: ${conflict.path} — ${conflict.reason}\n`);
  }
  assertSkillInstallComplete(surfaces.skills);

  if (metaMigration.movedState || metaMigration.regeneratedSpec || metaMigration.copiedSpec) {
    process.stdout.write(`moved machine state to ~/.iris/projects/${identity.id}/\n`);
  }

  process.stdout.write('iris initialized\n');
  process.stdout.write(
    'next: write iris/project/hld.md and iris/project/lld.md (Mermaid), then iris render --all\n',
  );
  process.stdout.write('then: iris research <id> or iris bug <id>\n');
  process.stdout.write('open: iris open\n');

  if (interactive) process.stdout.write(`${completionCard(palette, result)}\n`);

  return 0;
}
