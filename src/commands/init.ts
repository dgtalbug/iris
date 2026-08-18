import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureDir, writeAlways, writeIfMissing } from '../lib/fs.js';
import { BASE_COMPONENTS_CSS, BASE_COMPONENTS_JS, dashboardHtml, TOKENS_CSS } from '../templates/design.js';

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
      '  openspec: false',
      '  gitnexus: false',
      'budgets:',
      '  text_words_per_block: 120',
    ].join('\n') + '\n',
  );

  await writeIfMissing(
    path.join(irisRoot, 'state.json'),
    JSON.stringify({ last_synced_sha: null, page_index: {}, content_hashes: {} }, null, 2) + '\n',
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
  await writeAlways(path.join(irisRoot, 'design/tokens.css'), TOKENS_CSS);
  await writeAlways(path.join(irisRoot, 'design/components/base.css'), BASE_COMPONENTS_CSS);
  await writeAlways(path.join(irisRoot, 'design/components/base.js'), BASE_COMPONENTS_JS);

  for (const name of ['overview', 'hld', 'lld', 'erd', 'commands', 'decisions']) {
    await writeIfMissing(path.join(irisRoot, `project/${name}.html`), '<!doctype html><title>pending</title>\n');
  }

  await writeAlways(path.join(irisRoot, 'index.html'), dashboardHtml('iris project'));

  const vscodeTasksPath = path.join(cwd, '.vscode/tasks.json');
  await ensureDir(path.dirname(vscodeTasksPath));
  await writeFile(
    vscodeTasksPath,
    JSON.stringify(
      {
        version: '2.0.0',
        tasks: [
          {
            label: 'iris: open dashboard',
            type: 'shell',
            command: 'iris open',
            problemMatcher: [],
          },
        ],
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  process.stdout.write('iris initialized\n');
  process.stdout.write('next: iris report <id>\n');
  process.stdout.write('open: iris open\n');
}
