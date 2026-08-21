import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { ensureDir, writeIfMissing } from '../lib/fs.js';
import { writeOpenSpecSnapshot } from '../lib/openspec-workspace.js';
import { migrateProjectState } from '../lib/project-migration.js';
import { createProjectState, loadProjectState } from '../lib/project-state.js';
import { assertSkillInstallComplete, updateManagedSurfaces } from './lifecycle.js';
import { refreshDashboard } from './render.js';

export async function runInitCommand(cwd: string): Promise<void> {
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

  await writeIfMissing(
    path.join(irisRoot, 'state.json'),
    JSON.stringify(createProjectState(), null, 2) + '\n',
  );
  await writeIfMissing(path.join(irisRoot, 'design/vendor/.gitkeep'), '');
  await writeIfMissing(
    path.join(irisRoot, 'design/vendor/mermaid.min.js'),
    '/* Mermaid runtime not installed. Run `iris vendor` to enable diagram previews. */\n',
  );
  const migration = await migrateProjectState(cwd);
  const surfaces = await updateManagedSurfaces(cwd);
  await writeOpenSpecSnapshot(cwd);
  await refreshDashboard(cwd);

  await loadProjectState(cwd);
  await Promise.all([
    readFile(path.join(irisRoot, 'config.yaml'), 'utf8'),
    readFile(path.join(irisRoot, 'index.html'), 'utf8'),
    readFile(path.join(irisRoot, 'state.json'), 'utf8'),
  ]);

  for (const id of migration.removed)
    process.stdout.write(`removed generated adopted page ${id}\n`);
  for (const id of migration.preserved) {
    process.stderr.write(`preserved ambiguous legacy adopted page ${id}; review it manually\n`);
  }
  for (const retired of surfaces.retiredProjectDocs) {
    process.stdout.write(`removed retired managed page ${retired}\n`);
  }
  for (const preserved of surfaces.preservedProjectDocs) {
    process.stderr.write(`preserved user-owned ${preserved}; it is no longer generated\n`);
  }
  try {
    assertSkillInstallComplete(surfaces.skills);
  } catch (error) {
    if (error instanceof IrisError) throw error;
    throw new IrisError(1, (error as Error).message);
  }

  const skills = surfaces.skills;
  const installed = skills.created.length + skills.updated.length + skills.unchanged.length;
  process.stdout.write(
    `agent surfaces: ${installed} installed (${skills.created.length} created, ${skills.updated.length} updated, ${skills.unchanged.length} unchanged)\n`,
  );
  for (const conflict of skills.conflicts) {
    process.stderr.write(`agent surface not written: ${conflict.path} — ${conflict.reason}\n`);
  }

  process.stdout.write('iris initialized\n');
  process.stdout.write('next: iris research <id> or iris bug <id>\n');
  process.stdout.write('open: iris open\n');
}
