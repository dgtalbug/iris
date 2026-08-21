import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { ensureDir, writeIfMissing } from '../lib/fs.js';
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
      'detected_tools:',
      `  openspec: ${existsSync(path.join(cwd, 'openspec'))}`,
      '  gitnexus: false',
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
    'archive',
  ];
  await Promise.all(dirs.map((dir) => ensureDir(path.join(irisRoot, dir))));

  await writeIfMissing(
    path.join(irisRoot, 'state.json'),
    JSON.stringify(createProjectState(), null, 2) + '\n',
  );
  await writeIfMissing(path.join(irisRoot, 'design/vendor/.gitkeep'), '');
  const migration = await migrateProjectState(cwd);
  const skills = await updateManagedSurfaces(cwd);
  await refreshDashboard(cwd);

  await loadProjectState(cwd);
  await Promise.all([
    readFile(path.join(irisRoot, 'config.yaml'), 'utf8'),
    readFile(path.join(irisRoot, 'index.html'), 'utf8'),
    readFile(path.join(irisRoot, 'state.json'), 'utf8'),
  ]);

  for (const id of migration.removed) process.stdout.write(`removed generated adopted page ${id}\n`);
  for (const id of migration.preserved) {
    process.stderr.write(`preserved ambiguous legacy adopted page ${id}; review it manually\n`);
  }
  try {
    assertSkillInstallComplete(skills);
  } catch (error) {
    if (error instanceof IrisError) throw error;
    throw new IrisError(1, (error as Error).message);
  }

  process.stdout.write('iris initialized\n');
  process.stdout.write('next: iris report <id>\n');
  process.stdout.write('open: iris open\n');
}
