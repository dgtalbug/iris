import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { copyFile, lstat, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { IrisError } from './errors.js';
import { ensureDir } from './fs.js';

export type UserConfig = {
  version: 1;
  theme: string;
  agent: string | null;
  tools: string[];
  indexing: { enabled: boolean };
  dashboard: { generated: string | null };
};

export type ProjectIdentity = {
  id: string;
  name: string;
  root: string;
  remote: string | null;
};

export type RegistryEntry = ProjectIdentity & {
  created: string;
  lastSeen: string;
};

export type ProjectOverrides = {
  tools: string[] | null;
  indexing: { enabled: boolean } | null;
};

export type ProjectMeta = ProjectIdentity & {
  overrides: ProjectOverrides;
};

/**
 * Wired by the integrator to the real spec snapshot writer. Must write the
 * regenerated snapshot to `destPath`; throwing or leaving `destPath` absent
 * falls back to copying the existing in-repo snapshot.
 */
export type RegenerateSpecSnapshotHook = (cwd: string, destPath: string) => Promise<void>;

export type MigrateMetaResult = {
  id: string;
  dir: string;
  movedState: boolean;
  regeneratedSpec: boolean;
  copiedSpec: boolean;
};

const execFileAsync = promisify(execFile);

export function irisHome(): string {
  const override = process.env.IRIS_HOME;
  return override ? path.resolve(override) : path.join(os.homedir(), '.iris');
}

export function userConfigPath(): string {
  return path.join(irisHome(), 'config.json');
}

export function registryPath(): string {
  return path.join(irisHome(), 'registry.json');
}

export function projectsRoot(): string {
  return path.join(irisHome(), 'projects');
}

export function projectDir(id: string): string {
  return path.join(projectsRoot(), id);
}

export function projectMetaPath(id: string): string {
  return path.join(projectDir(id), 'project.json');
}

export function projectStatePath(id: string): string {
  return path.join(projectDir(id), 'state.json');
}

export function projectSpecPath(id: string): string {
  return path.join(projectDir(id), 'spec.json');
}

function sha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'project';
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const temporary = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${randomUUID()}.tmp`,
  );
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}

export function defaultUserConfig(): UserConfig {
  return {
    version: 1,
    theme: 'electric',
    agent: null,
    tools: [],
    indexing: { enabled: false },
    dashboard: { generated: null },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeConfig(value: unknown): UserConfig {
  const raw = asRecord(value);
  const indexing = asRecord(raw.indexing);
  const dashboard = asRecord(raw.dashboard);
  return {
    version: 1,
    theme: typeof raw.theme === 'string' && raw.theme ? raw.theme : 'electric',
    agent: typeof raw.agent === 'string' && raw.agent ? raw.agent : null,
    tools: Array.isArray(raw.tools)
      ? raw.tools.filter((tool): tool is string => typeof tool === 'string')
      : [],
    indexing: { enabled: indexing.enabled === true },
    dashboard: { generated: typeof dashboard.generated === 'string' ? dashboard.generated : null },
  };
}

export async function loadUserConfig(): Promise<UserConfig> {
  try {
    return normalizeConfig(JSON.parse(await readFile(userConfigPath(), 'utf8')));
  } catch {
    return defaultUserConfig();
  }
}

export async function saveUserConfig(config: UserConfig): Promise<void> {
  await writeJsonAtomic(userConfigPath(), normalizeConfig(config));
}

export async function ensureUserConfig(): Promise<{ config: UserConfig; created: boolean }> {
  if (existsSync(userConfigPath())) {
    return { config: await loadUserConfig(), created: false };
  }
  const config = defaultUserConfig();
  await saveUserConfig(config);
  return { config, created: true };
}

export async function getUserConfigValue<K extends keyof UserConfig>(
  key: K,
): Promise<UserConfig[K]> {
  return (await loadUserConfig())[key];
}

export async function setUserConfigValue<K extends keyof UserConfig>(
  key: K,
  value: UserConfig[K],
): Promise<UserConfig> {
  const config = await loadUserConfig();
  config[key] = value;
  await saveUserConfig(config);
  return config;
}

async function gitOriginUrl(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['remote', 'get-url', 'origin'], {
      cwd,
      timeout: 10_000,
      maxBuffer: 1024 * 1024,
    });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

export function normalizeRemoteUrl(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let host: string;
  let pathname: string;
  const scpLike = trimmed.includes('://') ? null : /^([^@/]+@)?([^:/]+):(.+)$/.exec(trimmed);
  if (scpLike) {
    host = scpLike[2];
    pathname = scpLike[3];
  } else {
    try {
      const url = new URL(trimmed.includes('://') ? trimmed : `ssh://${trimmed}`);
      host = url.hostname;
      pathname = url.pathname;
    } catch {
      return null;
    }
  }
  const cleanPath = pathname.replace(/\.git$/i, '').replace(/^\/+|\/+$/g, '');
  if (!host || !cleanPath) return null;
  return `${host}/${cleanPath}`.toLowerCase();
}

export async function resolveProjectIdentity(cwd: string): Promise<ProjectIdentity> {
  const root = await realpath(cwd);
  const remote = normalizeRemoteUrl(await gitOriginUrl(cwd));
  if (remote) {
    const name = slugify(path.posix.basename(remote));
    return { id: `${name}-${sha256(remote).slice(0, 8)}`, name, root, remote };
  }
  const name = slugify(path.basename(root));
  return { id: `${name}-${sha256(root).slice(0, 8)}`, name, root, remote: null };
}

function normalizeRegistryEntry(value: unknown): RegistryEntry | null {
  const raw = asRecord(value);
  if (typeof raw.id !== 'string' || !raw.id) return null;
  if (typeof raw.root !== 'string' || !raw.root) return null;
  const now = new Date().toISOString();
  return {
    id: raw.id,
    name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id,
    root: raw.root,
    remote: typeof raw.remote === 'string' && raw.remote ? raw.remote : null,
    created: typeof raw.created === 'string' ? raw.created : now,
    lastSeen: typeof raw.lastSeen === 'string' ? raw.lastSeen : now,
  };
}

export async function loadRegistry(): Promise<RegistryEntry[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(registryPath(), 'utf8'));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeRegistryEntry)
      .filter((entry): entry is RegistryEntry => entry !== null);
  } catch {
    return [];
  }
}

export async function saveRegistry(entries: RegistryEntry[]): Promise<void> {
  await writeJsonAtomic(registryPath(), entries);
}

function matchRegistryEntry(
  entries: RegistryEntry[],
  identity: ProjectIdentity,
): RegistryEntry | null {
  const byRoot = entries.find((entry) => entry.root === identity.root);
  if (byRoot) return byRoot;
  if (!identity.remote) return null;
  return entries.find((entry) => entry.remote === identity.remote) ?? null;
}

/** Read-only reconciliation: exact root match first, then normalized remote. */
export async function findRegisteredProject(cwd: string): Promise<RegistryEntry | null> {
  const identity = await resolveProjectIdentity(cwd);
  return matchRegistryEntry(await loadRegistry(), identity);
}

async function renameProjectDir(fromId: string, toId: string): Promise<void> {
  const from = projectDir(fromId);
  const to = projectDir(toId);
  if (!existsSync(from) || existsSync(to)) return;
  await rename(from, to);
}

/**
 * Add-or-refresh the registry entry for `cwd` and ensure its per-project home.
 * A checkout whose root changed but whose remote matches an existing entry is
 * re-pointed to the new root; a project that gains a remote after a path-based
 * registration is re-keyed and its state directory follows.
 */
export async function registerProject(cwd: string): Promise<RegistryEntry> {
  const identity = await resolveProjectIdentity(cwd);
  const entries = await loadRegistry();
  const now = new Date().toISOString();
  const existing = matchRegistryEntry(entries, identity);
  let entry: RegistryEntry;
  if (existing) {
    if (existing.id !== identity.id) {
      await renameProjectDir(existing.id, identity.id);
      existing.id = identity.id;
    }
    existing.name = identity.name;
    existing.root = identity.root;
    existing.remote = identity.remote ?? existing.remote;
    existing.lastSeen = now;
    entry = existing;
  } else {
    entry = { ...identity, created: now, lastSeen: now };
    entries.push(entry);
  }
  await saveRegistry(entries);
  await ensureProjectHome(entry);
  return entry;
}

function normalizeOverrides(value: unknown): ProjectOverrides {
  const raw = asRecord(value);
  const indexing = asRecord(raw.indexing);
  return {
    tools: Array.isArray(raw.tools)
      ? raw.tools.filter((tool): tool is string => typeof tool === 'string')
      : null,
    indexing:
      typeof raw.indexing === 'object' && raw.indexing !== null && !Array.isArray(raw.indexing)
        ? { enabled: indexing.enabled === true }
        : null,
  };
}

export async function loadProjectMeta(id: string): Promise<ProjectMeta | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(projectMetaPath(id), 'utf8'));
    const raw = asRecord(parsed);
    if (typeof raw.id !== 'string' || !raw.id) return null;
    if (typeof raw.root !== 'string' || !raw.root) return null;
    return {
      id: raw.id,
      name: typeof raw.name === 'string' && raw.name ? raw.name : raw.id,
      root: raw.root,
      remote: typeof raw.remote === 'string' && raw.remote ? raw.remote : null,
      overrides: normalizeOverrides(raw.overrides),
    };
  } catch {
    return null;
  }
}

export async function saveProjectMeta(meta: ProjectMeta): Promise<void> {
  await writeJsonAtomic(projectMetaPath(meta.id), meta);
}

export async function ensureProjectHome(identity: ProjectIdentity): Promise<ProjectMeta> {
  await ensureDir(projectDir(identity.id));
  const existing = await loadProjectMeta(identity.id);
  if (existing) {
    const next: ProjectMeta = {
      ...existing,
      id: identity.id,
      name: identity.name,
      root: identity.root,
      remote: identity.remote ?? existing.remote,
    };
    if (JSON.stringify(next) !== JSON.stringify(existing)) await saveProjectMeta(next);
    return next;
  }
  const meta: ProjectMeta = { ...identity, overrides: { tools: null, indexing: null } };
  await saveProjectMeta(meta);
  return meta;
}

export async function updateProjectOverrides(
  id: string,
  patch: Partial<ProjectOverrides>,
): Promise<ProjectMeta> {
  const meta = await loadProjectMeta(id);
  if (!meta) {
    throw new IrisError(1, `Unknown project '${id}'; run 'iris init' first`);
  }
  const next: ProjectMeta = {
    ...meta,
    overrides: {
      tools: patch.tools !== undefined ? patch.tools : meta.overrides.tools,
      indexing: patch.indexing !== undefined ? patch.indexing : meta.overrides.indexing,
    },
  };
  await saveProjectMeta(next);
  return next;
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    return (await lstat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function digestFile(filePath: string): Promise<string> {
  return sha256(await readFile(filePath));
}

async function moveFileAtomic(source: string, dest: string): Promise<void> {
  await ensureDir(path.dirname(dest));
  try {
    await rename(source, dest);
    return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EXDEV') throw error;
  }
  const temporary = path.join(path.dirname(dest), `.${path.basename(dest)}.${randomUUID()}.tmp`);
  try {
    await copyFile(source, temporary);
    const [sourceDigest, copyDigest] = await Promise.all([
      digestFile(source),
      digestFile(temporary),
    ]);
    if (sourceDigest !== copyDigest) {
      throw new IrisError(1, `Failed to verify ${path.basename(source)} after copying`);
    }
    await rename(temporary, dest);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  await rm(source);
}

// Mirrors the v1→v2 shape transform in loadProjectStateForMigration
// (src/lib/project-state.ts), which is path-bound to the in-repo location and
// not exported in reusable form; keep the entry normalization in sync.
async function migrateStateFileToV2(stateFile: string): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(stateFile, 'utf8'));
  } catch {
    return;
  }
  const value = asRecord(parsed);
  if (value.version !== 1) return;
  if (
    !value.page_index ||
    typeof value.page_index !== 'object' ||
    Array.isArray(value.page_index)
  ) {
    return;
  }
  const pageIndex = Object.fromEntries(
    Object.entries(value.page_index as Record<string, unknown>).map(([id, raw]) => {
      const entry = asRecord(raw);
      return [
        id,
        {
          id: typeof entry.id === 'string' ? entry.id : id,
          type: typeof entry.type === 'string' ? entry.type : 'page',
          title: typeof entry.title === 'string' ? entry.title : id,
          status: entry.status === 'archived' ? 'archived' : 'active',
        },
      ];
    }),
  );
  await writeJsonAtomic(stateFile, { version: 2, page_index: pageIndex });
}

/**
 * Relocate in-repo machine state (`iris/state.json`, `iris/spec.json`) into
 * `~/.iris/projects/<id>/`, registering the project on the way. The state file
 * moves atomically (rename, or copy + verify + delete across devices) and is
 * upgraded to version 2 at its new location; the spec snapshot is regenerated
 * through the provided hook when possible, otherwise copied. Prints exactly
 * one stdout line, and only when state actually moved.
 */
export async function migrateMetaToHome(
  cwd: string,
  regenerateSpecSnapshot?: RegenerateSpecSnapshotHook,
): Promise<MigrateMetaResult> {
  const entry = await registerProject(cwd);
  const result: MigrateMetaResult = {
    id: entry.id,
    dir: projectDir(entry.id),
    movedState: false,
    regeneratedSpec: false,
    copiedSpec: false,
  };

  const stateSource = path.join(cwd, 'iris', 'state.json');
  if (await isFile(stateSource)) {
    const stateDest = projectStatePath(entry.id);
    await moveFileAtomic(stateSource, stateDest);
    await migrateStateFileToV2(stateDest);
    result.movedState = true;
  }

  const specSource = path.join(cwd, 'iris', 'spec.json');
  if (await isFile(specSource)) {
    const specDest = projectSpecPath(entry.id);
    let regenerated = false;
    if (regenerateSpecSnapshot) {
      try {
        await regenerateSpecSnapshot(cwd, specDest);
        regenerated = existsSync(specDest);
      } catch {
        regenerated = false;
      }
    }
    if (regenerated) {
      await rm(specSource);
      result.regeneratedSpec = true;
    } else {
      await moveFileAtomic(specSource, specDest);
      result.copiedSpec = true;
    }
  }

  if (result.movedState || result.regeneratedSpec || result.copiedSpec) {
    console.log(`moved machine state to ~/.iris/projects/${entry.id}/`);
  }
  return result;
}
