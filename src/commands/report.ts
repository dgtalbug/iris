import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { validateContract } from '../lib/schemas.js';
import { writeAlways } from '../lib/fs.js';
import { loadProjectState } from '../lib/project-state.js';
import { runRenderCommand } from './render.js';

const SESSION_FILE_PATTERN =
  /(?:session|metadata|conversation|message|turn|checkpoint|reference|file|tool|event|summary|note|report).*(?:\.json|\.md|\.txt)$/i;
const TEXT_KEYS = [
  'summary',
  'headline',
  'description',
  'content',
  'message',
  'text',
  'report',
  'notes',
  'transcript',
  'outcome',
];

type JsonRecord = Record<string, unknown>;

interface SessionDocument {
  value: unknown;
  modifiedAt: string;
}

export interface SessionEvidence {
  source: string;
  inputShape: 'directory' | 'json-export' | 'text-export';
  workstream?: string;
  branch?: string;
  repo?: string;
  status?: string;
  timestamps: string[];
  filesTouched: string[];
  references: string[];
  checkpoints: string[];
  toolActivity: string[];
  highlights: string[];
}

function asRecord(value: unknown): JsonRecord | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function unique(values: string[], limit = 50): string[] {
  return Array.from(new Set(values.map(normalizeText).filter(Boolean))).slice(0, limit);
}

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'session-report'
  );
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function stringsAtKeys(value: unknown, keys: readonly string[]): string[] {
  const found: string[] = [];
  const visited = new Set<object>();
  const walk = (node: unknown): void => {
    if (node === null || typeof node !== 'object' || visited.has(node)) return;
    visited.add(node);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const [key, child] of Object.entries(node as JsonRecord)) {
      if (keys.includes(key)) {
        if (typeof child === 'string') found.push(child);
        if (Array.isArray(child)) {
          for (const item of child) {
            if (typeof item === 'string') found.push(item);
            else if (asRecord(item)) walk(item);
          }
        }
      }
      walk(child);
    }
  };
  walk(value);
  return unique(found);
}

function firstString(value: unknown, keys: readonly string[]): string | undefined {
  return stringsAtKeys(value, keys)[0];
}

function collectHighlights(value: unknown): string[] {
  if (typeof value === 'string') {
    return unique(
      value
        .split(/\n{2,}|\n(?=[-*]\s)/)
        .map((line) => line.replace(/^[-*]\s*/, ''))
        .filter((line) => line.length >= 8),
      8,
    );
  }
  return unique(
    stringsAtKeys(value, TEXT_KEYS).filter((item) => item.length >= 8),
    8,
  );
}

function collectReferences(value: unknown): string[] {
  const explicit = stringsAtKeys(value, [
    'references',
    'reference',
    'links',
    'link',
    'url',
    'pr',
    'issue',
    'commit',
  ]);
  const serialized = JSON.stringify(value) ?? '';
  const urls = serialized.match(/https?:\/\/[^\s"'<>\\]+/g) ?? [];
  const shas = serialized.match(/\b[0-9a-f]{7,40}\b/gi) ?? [];
  return unique([...explicit, ...urls, ...shas]);
}

function collectTimestamps(value: unknown): string[] {
  const candidates = stringsAtKeys(value, [
    'created',
    'created_at',
    'createdAt',
    'updated',
    'updated_at',
    'updatedAt',
    'timestamp',
    'started_at',
    'completed_at',
  ]);
  return unique(
    candidates
      .filter((candidate) => !Number.isNaN(Date.parse(candidate)))
      .map((candidate) => new Date(candidate).toISOString()),
  );
}

function collectFiles(value: unknown): string[] {
  return stringsAtKeys(value, [
    'files',
    'file',
    'files_touched',
    'filesTouched',
    'changed_files',
    'changedFiles',
    'file_activity',
    'fileActivity',
    'path',
  ]).filter((candidate) => !candidate.startsWith('http://') && !candidate.startsWith('https://'));
}

function parseDocument(raw: string, filePath: string): unknown {
  if (!raw.trim()) throw new IrisError(1, `Session file is empty: ${filePath}`);
  if (!filePath.toLowerCase().endsWith('.json')) return raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object')
      throw new Error('expected a JSON object or array');
    return parsed;
  } catch (error) {
    throw new IrisError(1, `Malformed session JSON in ${filePath}: ${(error as Error).message}`);
  }
}

async function readSessionDocuments(sourcePath: string): Promise<SessionDocument[]> {
  const sourceStats = await stat(sourcePath);
  if (!sourceStats.isDirectory()) {
    if (!/\.(json|md|txt)$/i.test(sourcePath)) {
      throw new IrisError(
        1,
        `Unsupported session input format: ${sourcePath} (expected .json, .md, .txt, or a directory)`,
      );
    }
    const raw = await readFile(sourcePath, 'utf8');
    return [{ value: parseDocument(raw, sourcePath), modifiedAt: sourceStats.mtime.toISOString() }];
  }

  const entries = (await readdir(sourcePath, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && SESSION_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
  if (entries.length === 0) {
    throw new IrisError(
      1,
      `No supported session files found in ${sourcePath}; expected named JSON, Markdown, or text session artifacts`,
    );
  }
  const documents: SessionDocument[] = [];
  for (const entry of entries) {
    const filePath = path.join(sourcePath, entry);
    const [raw, fileStats] = await Promise.all([readFile(filePath, 'utf8'), stat(filePath)]);
    if (!raw.trim()) continue;
    documents.push({
      value: parseDocument(raw, filePath),
      modifiedAt: fileStats.mtime.toISOString(),
    });
  }
  if (documents.length === 0)
    throw new IrisError(1, `Session source contains no non-empty session evidence: ${sourcePath}`);
  return documents;
}

export async function ingestSessionSource(cwd: string, source: string): Promise<SessionEvidence> {
  const sourcePath = path.resolve(cwd, source);
  if (!existsSync(sourcePath)) throw new IrisError(1, `Session source not found: ${source}`);
  const sourceStats = await stat(sourcePath);
  const documents = await readSessionDocuments(sourcePath);
  const values = documents.map((document) => document.value);
  const highlights = unique(values.flatMap(collectHighlights), 8);
  const checkpoints = unique(
    values.flatMap((value) => stringsAtKeys(value, ['checkpoints', 'checkpoint'])),
    20,
  );
  const toolActivity = unique(
    values.flatMap((value) =>
      stringsAtKeys(value, ['tool_activity', 'toolActivity', 'tools', 'tool', 'command']),
    ),
    20,
  );
  const references = unique(values.flatMap(collectReferences));
  const filesTouched = unique(values.flatMap(collectFiles));
  const timestamps = unique([
    ...values.flatMap(collectTimestamps),
    ...documents.map((document) => document.modifiedAt),
  ]).sort();
  if (
    highlights.length === 0 &&
    checkpoints.length === 0 &&
    toolActivity.length === 0 &&
    references.length === 0 &&
    filesTouched.length === 0
  ) {
    throw new IrisError(
      1,
      `No reportable session evidence found in ${source}; expected turns, checkpoints, summaries, tool activity, files, or references`,
    );
  }
  return {
    source: path.relative(cwd, sourcePath) || '.',
    inputShape: sourceStats.isDirectory()
      ? 'directory'
      : sourcePath.toLowerCase().endsWith('.json')
        ? 'json-export'
        : 'text-export',
    workstream: firstString(values, ['workstream', 'title', 'name']),
    branch: firstString(values, ['branch', 'branch_name', 'branchName']),
    repo: firstString(values, ['repo', 'repository', 'repo_path', 'repoPath']),
    status: firstString(values, ['status', 'state']),
    timestamps,
    filesTouched,
    references,
    checkpoints,
    toolActivity,
    highlights,
  };
}

function concise(value: string, maxLength = 180): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildSummary(evidence: SessionEvidence): string[] {
  const outcome = evidence.highlights[0] ?? evidence.checkpoints[0] ?? evidence.toolActivity[0];
  const summary = [
    outcome ? concise(outcome) : undefined,
    `Workstream: ${evidence.workstream ?? 'unspecified'} · Status: ${evidence.status ?? 'unknown'}`,
    evidence.repo || evidence.branch
      ? `Repository: ${evidence.repo ?? 'unspecified'} · Branch: ${evidence.branch ?? 'unspecified'}`
      : undefined,
    evidence.filesTouched.length
      ? `Files touched: ${evidence.filesTouched.slice(0, 6).join(', ')}`
      : undefined,
    evidence.references.length
      ? `References: ${evidence.references.slice(0, 4).join(', ')}`
      : undefined,
  ];
  return unique(
    summary.filter((item): item is string => Boolean(item)),
    5,
  ).map((item) => concise(item));
}

function evidenceMarkdown(evidence: SessionEvidence): string {
  const lines = [
    `- Source: ${evidence.source} (${evidence.inputShape})`,
    `- Workstream: ${evidence.workstream ?? 'unspecified'}`,
    `- Status: ${evidence.status ?? 'unknown'}`,
    evidence.repo ? `- Repository: ${evidence.repo}` : undefined,
    evidence.branch ? `- Branch: ${evidence.branch}` : undefined,
    evidence.timestamps.length ? `- Timestamps: ${evidence.timestamps.join(', ')}` : undefined,
    evidence.filesTouched.length
      ? `- Files touched: ${evidence.filesTouched.join(', ')}`
      : undefined,
    evidence.references.length ? `- References: ${evidence.references.join(', ')}` : undefined,
    evidence.checkpoints.length ? `- Checkpoints: ${evidence.checkpoints.join('; ')}` : undefined,
    evidence.toolActivity.length
      ? `- Tool activity: ${evidence.toolActivity.join('; ')}`
      : undefined,
  ];
  return lines.filter((line): line is string => Boolean(line)).join('\n');
}

export async function runReportFromSessionCommand(
  cwd: string,
  source: string,
  id?: string,
): Promise<void> {
  const evidence = await ingestSessionSource(cwd, source);
  await loadProjectState(cwd);
  const sourcePath = path.resolve(cwd, source);
  const reportId = id ? slugify(id) : slugify(path.basename(sourcePath, path.extname(sourcePath)));
  const title = concise(
    id
      ? titleCase(reportId.replace(/-/g, ' '))
      : evidence.workstream
        ? titleCase(evidence.workstream)
        : titleCase(reportId.replace(/-/g, ' ')),
    80,
  );
  const timestamps = evidence.timestamps.length ? evidence.timestamps : [new Date().toISOString()];
  const reportFile = path.join(cwd, 'iris', 'pages', reportId, 'data.json');
  let existingCreated: string | undefined;
  if (existsSync(reportFile)) {
    try {
      const existing = JSON.parse(await readFile(reportFile, 'utf8')) as JsonRecord;
      existingCreated = typeof existing.created === 'string' ? existing.created : undefined;
    } catch {
      // The newly generated, validated report replaces an unreadable local record.
    }
  }
  const report = {
    iris: '1',
    type: 'report',
    id: reportId,
    title,
    status: evidence.status === 'done' || evidence.status === 'completed' ? 'done' : 'draft',
    agent: 'other',
    created: existingCreated ?? timestamps[0],
    updated: timestamps[timestamps.length - 1],
    commit:
      evidence.references.find((reference) => /^[0-9a-f]{40}$/i.test(reference))?.toLowerCase() ??
      '0'.repeat(40),
    tags: [
      'report',
      'session',
      evidence.workstream ? slugify(evidence.workstream) : undefined,
    ].filter((tag): tag is string => Boolean(tag)),
    sections: {
      summary: buildSummary(evidence),
      open_items: { md: evidenceMarkdown(evidence) },
      promotable_as: ['feature', 'bug', 'idea'],
      session_evidence: {
        source: evidence.source,
        input_shape: evidence.inputShape,
        workstream: evidence.workstream ?? null,
        status: evidence.status ?? null,
        repo: evidence.repo ?? null,
        branch: evidence.branch ?? null,
        timestamps: evidence.timestamps,
        files_touched: evidence.filesTouched,
        references: evidence.references,
        checkpoints: evidence.checkpoints,
        tool_activity: evidence.toolActivity,
      },
    },
  };
  const reportJson = `${JSON.stringify(report, null, 2)}\n`;
  await validateContract('report', report, reportFile);
  await writeAlways(reportFile, reportJson);
  await runRenderCommand(cwd);
  process.stdout.write(`created report ${reportId} from session ${source}\n`);
}
