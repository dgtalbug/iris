import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Provenance guard: keeps external tool and source names out of user-facing
 * output. The scanner reports file:line with a suggested rewording and never
 * rewrites content. Hits inside IRIS:MANAGED blocks are marked so the surface
 * is regenerated rather than edited by hand.
 */

export type DenylistEntry = {
  name: string;
  suggestion: string;
};

export type AllowlistEntry = {
  path: string;
  pattern?: string;
  linePattern?: string;
  justification: string;
};

export type ProvenanceFinding = {
  file: string;
  line: number;
  match: string;
  suggestion: string;
  managed: boolean;
};

export type ScanOptions = {
  cwd?: string;
  denylist?: readonly DenylistEntry[];
  allowlist?: readonly AllowlistEntry[];
};

export const ALLOWLIST_FILENAME = 'provenance.allowlist.json';

export const PROVENANCE_DENYLIST: readonly DenylistEntry[] = [
  { name: 'openspec', suggestion: 'Say "Specs" or "change proposals" instead.' },
  { name: 'opsx', suggestion: 'Say "Specs" instead.' },
  { name: 'sharrd', suggestion: 'Say "Iris" instead.' },
  { name: 'vision-report', suggestion: 'Say "Iris" instead.' },
  { name: 'vision-electric', suggestion: 'Say "Iris Electric" instead.' },
  { name: 'Vision Electric', suggestion: 'Say "Iris Electric" instead.' },
  { name: 'fission', suggestion: 'Say "Iris" instead.' },
];

export const DEFAULT_SCAN_TARGETS: readonly string[] = [
  '**/skills/iris-*/**',
  '.claude/commands/iris/**',
  '.github/prompts/iris-*.prompt.md',
  '.cursor/**/iris-*',
  'templates/**',
  'src/**/*.ts',
  'README.md',
  'docs/**',
  'iris/**/*.html',
  '*.html',
];

const SKIPPED_DIRECTORIES = new Set(['.git', 'dist', 'node_modules']);
const BINARY_EXTENSIONS = new Set([
  '.br',
  '.eot',
  '.gif',
  '.gz',
  '.ico',
  '.jpeg',
  '.jpg',
  '.mp4',
  '.otf',
  '.pdf',
  '.png',
  '.ttf',
  '.webm',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MANAGED_START = /<!--\s*IRIS:MANAGED:START/;
const MANAGED_END = /<!--\s*IRIS:MANAGED:END/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function globToRegExp(glob: string): RegExp {
  let source = '';
  let index = 0;
  while (index < glob.length) {
    const char = glob[index];
    if (char === '*') {
      if (glob[index + 1] === '*') {
        if (glob[index + 2] === '/') {
          source += '(?:[^/]+/)*';
          index += 3;
        } else {
          source += '.*';
          index += 2;
        }
      } else {
        source += '[^/]*';
        index += 1;
      }
    } else if (char === '?') {
      source += '[^/]';
      index += 1;
    } else {
      source += escapeRegExp(char);
      index += 1;
    }
  }
  return new RegExp(`^${source}$`);
}

function validateAllowlistEntry(entry: unknown, index: number): AllowlistEntry {
  const prefix = `${ALLOWLIST_FILENAME}: entry ${index}`;
  if (typeof entry !== 'object' || entry === null) {
    throw new Error(`${prefix} must be an object`);
  }
  const candidate = entry as Record<string, unknown>;
  if (typeof candidate.path !== 'string' || candidate.path.trim() === '') {
    throw new Error(`${prefix} must name a path`);
  }
  if (typeof candidate.justification !== 'string' || candidate.justification.trim() === '') {
    throw new Error(`${prefix} (${candidate.path}) is missing a required justification`);
  }
  for (const field of ['pattern', 'linePattern'] as const) {
    if (candidate[field] !== undefined && typeof candidate[field] !== 'string') {
      throw new Error(`${prefix} (${candidate.path}): ${field} must be a string`);
    }
  }
  if (typeof candidate.linePattern === 'string') {
    try {
      new RegExp(candidate.linePattern);
    } catch {
      throw new Error(
        `${prefix} (${candidate.path}): linePattern is not a valid regular expression`,
      );
    }
  }
  return candidate as unknown as AllowlistEntry;
}

export async function loadAllowlist(cwd: string): Promise<AllowlistEntry[]> {
  let raw: string;
  try {
    raw = await readFile(path.join(cwd, ALLOWLIST_FILENAME), 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (!Array.isArray(parsed.allowlist)) {
    throw new Error(`${ALLOWLIST_FILENAME}: "allowlist" must be an array`);
  }
  return parsed.allowlist.map((entry, index) => validateAllowlistEntry(entry, index));
}

type CompiledAllowlistEntry = {
  pathPattern: RegExp;
  name?: string;
  lineRegex?: RegExp;
};

function compileAllowlist(entries: readonly AllowlistEntry[]): CompiledAllowlistEntry[] {
  return entries.map((entry) => ({
    pathPattern: globToRegExp(entry.path),
    ...(entry.pattern === undefined ? {} : { name: entry.pattern.toLowerCase() }),
    ...(entry.linePattern === undefined ? {} : { lineRegex: new RegExp(entry.linePattern) }),
  }));
}

async function collectFiles(cwd: string, dir = ''): Promise<string[]> {
  const entries = await readdir(path.join(cwd, dir), { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const relative = dir === '' ? entry.name : `${dir}/${entry.name}`;
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...(await collectFiles(cwd, relative)));
      }
    } else if (entry.isFile() && !BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(relative);
    }
  }
  return files;
}

export async function scan(
  pathsOrGlobs: readonly string[],
  options: ScanOptions = {},
): Promise<ProvenanceFinding[]> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const denylist = options.denylist ?? PROVENANCE_DENYLIST;
  const allowlist = compileAllowlist(
    (options.allowlist ?? (await loadAllowlist(cwd))).map((entry, index) =>
      validateAllowlistEntry(entry, index),
    ),
  );
  const targets = pathsOrGlobs.map((glob) => globToRegExp(glob));
  const matchers = denylist.map((entry) => ({
    entry,
    pattern: new RegExp(`\\b${escapeRegExp(entry.name)}\\b`, 'gi'),
  }));

  const findings: ProvenanceFinding[] = [];
  for (const file of await collectFiles(cwd)) {
    if (!targets.some((target) => target.test(file))) continue;
    const content = await readFile(path.join(cwd, file), 'utf8');
    if (Buffer.byteLength(content) > MAX_FILE_BYTES) continue;
    let managed = false;
    content.split(/\r?\n/).forEach((text, index) => {
      if (MANAGED_START.test(text)) managed = true;
      for (const { entry, pattern } of matchers) {
        pattern.lastIndex = 0;
        for (const hit of text.matchAll(pattern)) {
          const suppressed = allowlist.some(
            (allow) =>
              allow.pathPattern.test(file) &&
              (allow.name === undefined || allow.name === entry.name.toLowerCase()) &&
              (allow.lineRegex === undefined || allow.lineRegex.test(text)),
          );
          if (suppressed) continue;
          findings.push({
            file,
            line: index + 1,
            match: hit[0],
            suggestion: managed
              ? `Managed block — regenerate this surface instead of editing it. ${entry.suggestion}`
              : entry.suggestion,
            managed,
          });
        }
      }
      if (MANAGED_END.test(text)) managed = false;
    });
  }

  findings.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line);
  return findings;
}

/** Runtime scan after init/update/render — warns on stderr, never exits non-zero. */
export async function reportProvenanceWarnings(
  cwd: string,
  pathsOrGlobs: readonly string[] = DEFAULT_SCAN_TARGETS,
): Promise<number> {
  let findings: ProvenanceFinding[];
  try {
    findings = await scan(pathsOrGlobs, { cwd });
  } catch (error) {
    process.stderr.write(`provenance: ${(error as Error).message}\n`);
    return 0;
  }

  for (const finding of findings) {
    const managed = finding.managed ? ' [managed — regenerate the surface]' : '';
    process.stderr.write(
      `provenance: ${finding.file}:${finding.line}: '${finding.match}'${managed} — ${finding.suggestion}\n`,
    );
  }
  if (findings.length > 0) {
    process.stderr.write(`provenance: ${findings.length} finding(s)\n`);
  }
  return findings.length;
}
