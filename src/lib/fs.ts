import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export async function writeIfMissing(filePath: string, content: string): Promise<boolean> {
  try {
    await readFile(filePath, 'utf8');
    return false;
  } catch {
    await ensureDir(path.dirname(filePath));
    await writeFile(filePath, content, 'utf8');
    return true;
  }
}

export async function writeAlways(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, content, 'utf8');
}
