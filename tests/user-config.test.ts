import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultUserConfig,
  ensureUserConfig,
  findRegisteredProject,
  getUserConfigValue,
  irisHome,
  loadProjectMeta,
  loadRegistry,
  loadUserConfig,
  normalizeRemoteUrl,
  projectDir,
  registerProject,
  resolveProjectIdentity,
  saveRegistry,
  setUserConfigValue,
  updateProjectOverrides,
  userConfigPath,
} from '../src/lib/user-config.js';

const execFileAsync = promisify(execFile);

const tempDirs: string[] = [];
let home: string;

beforeEach(async () => {
  home = await mkdtemp(path.join(os.tmpdir(), 'iris-home-'));
  tempDirs.push(home);
  vi.stubEnv('IRIS_HOME', home);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function tempProject(prefix = 'iris-project-'): Promise<string> {
  const cwd = await mkdtemp(path.join(os.tmpdir(), prefix));
  tempDirs.push(cwd);
  return cwd;
}

async function gitInit(cwd: string, remote?: string): Promise<void> {
  await execFileAsync('git', ['init'], { cwd });
  if (remote) await execFileAsync('git', ['remote', 'add', 'origin', remote], { cwd });
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('user config', () => {
  it('returns defaults when no config exists and never writes on read', async () => {
    expect(irisHome()).toBe(home);
    expect(await loadUserConfig()).toEqual(defaultUserConfig());
    expect(existsSync(userConfigPath())).toBe(false);
  });

  it('writes defaults on first ensure and preserves stored values after', async () => {
    const first = await ensureUserConfig();
    expect(first.created).toBe(true);
    expect(JSON.parse(await readFile(userConfigPath(), 'utf8'))).toEqual(defaultUserConfig());

    await setUserConfigValue('theme', 'midnight');
    await setUserConfigValue('tools', ['claude', 'cursor']);
    await setUserConfigValue('indexing', { enabled: true });

    const second = await ensureUserConfig();
    expect(second.created).toBe(false);
    expect(second.config.theme).toBe('midnight');
    expect(second.config.tools).toEqual(['claude', 'cursor']);
    expect(second.config.indexing).toEqual({ enabled: true });
    expect(await getUserConfigValue('theme')).toBe('midnight');
    expect(await getUserConfigValue('agent')).toBeNull();
  });

  it('falls back to safe defaults for partial or corrupt config', async () => {
    await mkdir(path.dirname(userConfigPath()), { recursive: true });
    await writeFile(
      userConfigPath(),
      '{"version":1,"theme":42,"tools":"nope","indexing":{"enabled":"yes"}}\n',
    );
    const partial = await loadUserConfig();
    expect(partial.theme).toBe('electric');
    expect(partial.tools).toEqual([]);
    expect(partial.indexing).toEqual({ enabled: false });

    await writeFile(userConfigPath(), '{not json');
    expect(await loadUserConfig()).toEqual(defaultUserConfig());
  });

  it('writes config atomically without leaving temp files behind', async () => {
    await setUserConfigValue('agent', 'claude');
    const entries = await readdir(home);
    expect(entries.filter((entry) => entry.endsWith('.tmp'))).toEqual([]);
    const raw = await readFile(userConfigPath(), 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
    expect(JSON.parse(raw).agent).toBe('claude');
  });
});

describe('remote normalization', () => {
  it('normalizes protocol, userinfo, case, and .git suffix', () => {
    expect(normalizeRemoteUrl('https://github.com/Acme/Widgets.git')).toBe(
      'github.com/acme/widgets',
    );
    expect(normalizeRemoteUrl('git@github.com:Acme/Widgets.git')).toBe('github.com/acme/widgets');
    expect(normalizeRemoteUrl('ssh://git@github.com/Acme/Widgets/')).toBe(
      'github.com/acme/widgets',
    );
    expect(normalizeRemoteUrl('https://user:token@gitlab.example.com/Group/Sub/Repo.git')).toBe(
      'gitlab.example.com/group/sub/repo',
    );
  });

  it('rejects empty and local-path remotes', () => {
    expect(normalizeRemoteUrl(null)).toBeNull();
    expect(normalizeRemoteUrl('')).toBeNull();
    expect(normalizeRemoteUrl('   ')).toBeNull();
    expect(normalizeRemoteUrl('/local/path/repo.git')).toBeNull();
  });
});

describe('project identity', () => {
  it('derives identity from the normalized git remote', async () => {
    const cwd = await tempProject();
    await gitInit(cwd, 'https://github.com/Acme/Widgets.git');
    const identity = await resolveProjectIdentity(cwd);
    expect(identity.remote).toBe('github.com/acme/widgets');
    expect(identity.name).toBe('widgets');
    expect(identity.id).toBe(`widgets-${sha256('github.com/acme/widgets').slice(0, 8)}`);
    expect(identity.root).toBe(await realpath(cwd));
  });

  it('gives the same identity for scp-like and https remotes', async () => {
    const scp = await tempProject('iris-scp-');
    await gitInit(scp, 'git@github.com:Acme/Widgets.git');
    const https = await tempProject('iris-https-');
    await gitInit(https, 'https://github.com/acme/widgets.git');
    const scpIdentity = await resolveProjectIdentity(scp);
    const httpsIdentity = await resolveProjectIdentity(https);
    expect(scpIdentity.id).toBe(httpsIdentity.id);
    expect(scpIdentity.root).not.toBe(httpsIdentity.root);
  });

  it('falls back to the absolute realpath hash without a git remote', async () => {
    const cwd = await tempProject();
    const identity = await resolveProjectIdentity(cwd);
    const root = await realpath(cwd);
    const slug = path.basename(root).toLowerCase();
    expect(identity.remote).toBeNull();
    expect(identity.name).toBe(slug);
    expect(identity.id).toBe(`${slug}-${sha256(root).slice(0, 8)}`);
  });
});

describe('project registry', () => {
  it('adds a project once and refreshes lastSeen on re-register', async () => {
    const cwd = await tempProject();
    await gitInit(cwd, 'git@github.com:acme/widgets.git');
    const first = await registerProject(cwd);

    const entries = await loadRegistry();
    expect(entries).toHaveLength(1);
    entries[0].lastSeen = '2000-01-01T00:00:00.000Z';
    await saveRegistry(entries);

    const second = await registerProject(cwd);
    const after = await loadRegistry();
    expect(after).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(after[0].created).toBe(first.created);
    expect(after[0].lastSeen).not.toBe('2000-01-01T00:00:00.000Z');
  });

  it('reconciles a moved checkout by remote and keeps its state', async () => {
    const first = await tempProject('iris-checkout-');
    await gitInit(first, 'https://github.com/acme/widgets.git');
    const before = await registerProject(first);
    await writeFile(
      path.join(projectDir(before.id), 'state.json'),
      '{"version":2,"page_index":{}}\n',
    );

    const movedParent = await tempProject('iris-moved-');
    const moved = path.join(movedParent, 'checkout');
    await rename(first, moved);

    const after = await registerProject(moved);
    expect(after.id).toBe(before.id);
    expect(after.root).toBe(await realpath(moved));

    const entries = await loadRegistry();
    expect(entries).toHaveLength(1);
    expect(entries[0].root).toBe(await realpath(moved));
    expect(entries[0].created).toBe(before.created);
    expect(existsSync(path.join(projectDir(before.id), 'state.json'))).toBe(true);

    const found = await findRegisteredProject(moved);
    expect(found?.id).toBe(before.id);
  });

  it('re-keys a project that gains a remote after a path-based registration', async () => {
    const cwd = await tempProject();
    await gitInit(cwd);
    const pathBased = await registerProject(cwd);
    expect(pathBased.remote).toBeNull();
    await writeFile(
      path.join(projectDir(pathBased.id), 'state.json'),
      '{"version":2,"page_index":{}}\n',
    );

    await execFileAsync('git', ['remote', 'add', 'origin', 'https://github.com/acme/widgets.git'], {
      cwd,
    });
    const remoteBased = await registerProject(cwd);
    expect(remoteBased.id).not.toBe(pathBased.id);
    expect(remoteBased.remote).toBe('github.com/acme/widgets');

    const entries = await loadRegistry();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(remoteBased.id);
    expect(existsSync(path.join(projectDir(remoteBased.id), 'state.json'))).toBe(true);
    expect(existsSync(projectDir(pathBased.id))).toBe(false);
  });

  it('returns null when looking up an unknown project', async () => {
    expect(await findRegisteredProject(await tempProject())).toBeNull();
  });
});

describe('per-project home', () => {
  it('writes project.json with overrides and preserves them across re-register', async () => {
    const cwd = await tempProject();
    const entry = await registerProject(cwd);

    const meta = await loadProjectMeta(entry.id);
    expect(meta).toMatchObject({
      id: entry.id,
      name: entry.name,
      root: entry.root,
      remote: entry.remote,
      overrides: { tools: null, indexing: null },
    });

    const updated = await updateProjectOverrides(entry.id, {
      tools: ['claude'],
      indexing: { enabled: true },
    });
    expect(updated.overrides.tools).toEqual(['claude']);

    await registerProject(cwd);
    const after = await loadProjectMeta(entry.id);
    expect(after?.overrides.tools).toEqual(['claude']);
    expect(after?.overrides.indexing).toEqual({ enabled: true });
  });

  it('rejects overrides for an unknown project', async () => {
    await expect(updateProjectOverrides('nope', { tools: [] })).rejects.toThrow(/Unknown project/);
  });
});
