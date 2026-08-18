import path from 'node:path';
import { writeAlways } from '../lib/fs.js';
import { dashboardHtml } from '../templates/design.js';

export async function runRenderCommand(cwd: string): Promise<void> {
  const indexPath = path.join(cwd, 'iris/index.html');
  await writeAlways(indexPath, dashboardHtml('iris project'));
  process.stdout.write('rendered iris/index.html\n');
}
