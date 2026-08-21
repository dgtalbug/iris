import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, writeAlways, writeIfMissing } from '../lib/fs.js';
import { createProjectState, loadProjectState } from '../lib/project-state.js';
import { updateManagedSurfaces } from './lifecycle.js';
import { refreshDashboard } from './render.js';

export async function runInitCommand(cwd: string): Promise<void> {
  const irisRoot = path.join(cwd, 'iris');
  await ensureDir(irisRoot);

  await writeIfMissing(
    path.join(irisRoot, 'config.yaml'),
    [
      'project: iris-project',
      'theme: dark',
      'asset_base: cdn',
      'detected_tools:',
      `  openspec: ${existsSync(path.join(cwd, 'openspec'))}`,
      '  gitnexus: false',
      'budgets:',
      '  text_words_per_block: 120',
    ].join('\n') + '\n',
  );

  await writeIfMissing(
    path.join(irisRoot, 'state.json'),
    JSON.stringify(createProjectState(), null, 2) + '\n',
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

  await writeIfMissing(path.join(irisRoot, 'design/vendor/.gitkeep'), '');
  await updateManagedSurfaces(cwd);
  await refreshDashboard(cwd);

  await loadProjectState(cwd);
  await Promise.all([
    readFile(path.join(irisRoot, 'config.yaml'), 'utf8'),
    readFile(path.join(irisRoot, 'index.html'), 'utf8'),
    readFile(path.join(irisRoot, 'state.json'), 'utf8'),
  ]);

  process.stdout.write('iris initialized\n');
  process.stdout.write('next: iris report <id>\n');
  process.stdout.write('open: iris open\n');
}
