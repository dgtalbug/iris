import { existsSync } from 'node:fs';
import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { ensureDir } from '../lib/fs.js';

export const MERMAID_VERSION = '11.17.0';

type MermaidPackage = {
  name?: string;
  version?: string;
};

function installedMermaidRoot(): string {
  try {
    const require = createRequire(import.meta.url);
    return path.dirname(path.dirname(require.resolve('mermaid')));
  } catch (error) {
    throw new IrisError(
      1,
      `Installed Iris package is missing Mermaid ${MERMAID_VERSION}: ${(error as Error).message}`,
    );
  }
}

async function readInstalledAssets(): Promise<{
  bundle: Buffer;
  license: Buffer;
}> {
  const packageRoot = installedMermaidRoot();
  try {
    const manifest = JSON.parse(
      await readFile(path.join(packageRoot, 'package.json'), 'utf8'),
    ) as MermaidPackage;
    if (manifest.name !== 'mermaid' || manifest.version !== MERMAID_VERSION) {
      throw new Error(
        `expected mermaid ${MERMAID_VERSION}, found ${manifest.name ?? 'unknown'} ${manifest.version ?? 'unknown'}`,
      );
    }
    const [bundle, license] = await Promise.all([
      readFile(path.join(packageRoot, 'dist', 'mermaid.min.js')),
      readFile(path.join(packageRoot, 'LICENSE')),
    ]);
    return { bundle, license };
  } catch (error) {
    throw new IrisError(
      1,
      `Installed Mermaid ${MERMAID_VERSION} assets are incomplete: ${(error as Error).message}`,
    );
  }
}

async function writeAtomic(filePath: string, content: Buffer): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const temporaryPath = `${filePath}.tmp-${process.pid}`;
  try {
    await writeFile(temporaryPath, content);
    await rename(temporaryPath, filePath);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function runVendorCommand(cwd: string): Promise<void> {
  const irisRoot = path.join(cwd, 'iris');
  if (!existsSync(path.join(irisRoot, 'state.json'))) {
    throw new IrisError(1, "Iris is not initialized; run 'iris init' before 'iris vendor'");
  }

  const assets = await readInstalledAssets();
  const vendorRoot = path.join(irisRoot, 'design', 'vendor');
  await Promise.all([
    writeAtomic(path.join(vendorRoot, 'mermaid.min.js'), assets.bundle),
    writeAtomic(path.join(vendorRoot, 'LICENSE.mermaid.txt'), assets.license),
  ]);
  process.stdout.write(`vendored Mermaid ${MERMAID_VERSION}\n`);
}
