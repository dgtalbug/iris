import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, vi } from 'vitest';

const tempDirs: string[] = [];

beforeEach(async () => {
  const home = await mkdtemp(path.join(os.tmpdir(), 'iris-home-'));
  tempDirs.push(home);
  vi.stubEnv('IRIS_HOME', home);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});
