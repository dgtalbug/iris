import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { createStandaloneArtifact } from './publish.js';

export type ExportMode = 'single' | 'png' | 'pdf';

export type ExportOptions = {
  mode?: ExportMode;
  outputPath?: string;
};

export async function runExportCommand(
  cwd: string,
  id: string | undefined,
  options: ExportOptions = {},
): Promise<void> {
  if (!id) {
    throw new IrisError(1, "Missing id for command 'export'");
  }

  const mode = options.mode ?? 'single';
  if (!['single', 'png', 'pdf'].includes(mode)) {
    throw new IrisError(1, `Unsupported export mode '${String(mode)}'; choose single, png, or pdf`);
  }

  if (mode !== 'single') {
    throw new IrisError(
      1,
      `Export mode '--${mode}' is not available yet; PNG and PDF require an approved browser renderer dependency`,
    );
  }

  const destination = options.outputPath
    ? path.resolve(cwd, options.outputPath)
    : path.join(cwd, 'iris', 'archive', `${id}.html`);

  await createStandaloneArtifact(cwd, id, destination);
  process.stdout.write(`exported ${path.relative(cwd, destination)}\n`);
}
