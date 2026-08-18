import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { IrisError } from '../lib/errors.js';
import { validateContract } from '../lib/schemas.js';
import { writeAlways } from '../lib/fs.js';
import { runRenderCommand } from './render.js';

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'session-report';
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

function collectSummaryStrings(value: unknown): string[] {
  const summaries: string[] = [];

  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      const trimmed = node.trim();
      if (trimmed) {
        summaries.push(trimmed.replace(/\s+/g, ' '));
      }
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (node && typeof node === 'object') {
      const record = node as Record<string, unknown>;
      for (const key of ['title', 'summary', 'headline', 'description', 'content', 'message', 'text', 'report', 'notes', 'transcript']) {
        if (key in record) {
          walk(record[key]);
        }
      }

      if (Array.isArray(record.messages)) {
        for (const entry of record.messages) {
          walk(entry);
        }
      }

      if (Array.isArray(record.items)) {
        for (const entry of record.items) {
          walk(entry);
        }
      }

      if (Array.isArray(record.events)) {
        for (const entry of record.events) {
          walk(entry);
        }
      }

      for (const value of Object.values(record)) {
        if (typeof value === 'string' || Array.isArray(value) || (value && typeof value === 'object')) {
          walk(value);
        }
      }
    }
  };

  walk(value);

  return Array.from(new Set(summaries)).filter((summary) => summary.length >= 8).slice(0, 5);
}

async function readSessionText(sourcePath: string): Promise<string> {
  const sourceStats = await stat(sourcePath);

  if (sourceStats.isDirectory()) {
    const preferredNames = [
      'session.json',
      'conversation.json',
      'messages.json',
      'summary.md',
      'notes.md',
      'report.md',
      'README.md',
    ];

    for (const entryName of preferredNames) {
      const candidate = path.join(sourcePath, entryName);
      if (existsSync(candidate)) {
        return readFile(candidate, 'utf8');
      }
    }

    const directoryEntries = (await readdir(sourcePath)).filter((entry) => /\.(json|md|txt)$/i.test(entry)).sort();
    if (directoryEntries.length === 0) {
      throw new IrisError(1, `No session files found in ${sourcePath}`);
    }

    const buffer: string[] = [];
    for (const entryName of directoryEntries.slice(0, 5)) {
      buffer.push(await readFile(path.join(sourcePath, entryName), 'utf8'));
    }
    return buffer.join('\n\n---\n\n');
  }

  return readFile(sourcePath, 'utf8');
}

export async function runReportFromSessionCommand(cwd: string, source: string, id?: string): Promise<void> {
  const sourcePath = path.resolve(cwd, source);
  if (!existsSync(sourcePath)) {
    throw new IrisError(1, `Session source not found: ${source}`);
  }

  const raw = await readSessionText(sourcePath);
  let parsed: unknown = raw;

  try {
    parsed = JSON.parse(raw);
  } catch {
    // Ignore invalid JSON and use the raw text as the source material.
  }

  const summaryStrings = collectSummaryStrings(parsed);
  if (summaryStrings.length === 0) {
    throw new IrisError(1, `No reportable session data found in ${source}`);
  }

  const reportId = id ? slugify(id) : slugify(path.basename(sourcePath));
  const title = titleCase(reportId.replace(/-/g, ' ')) || 'Session Report';

  const created = new Date().toISOString();
  const report = {
    iris: '1',
    type: 'report',
    id: reportId,
    title,
    status: 'draft',
    agent: 'copilot',
    created,
    updated: created,
    commit: '0'.repeat(40),
    tags: ['report', 'session'],
    sections: {
      summary: summaryStrings,
      open_items: {
        md: summaryStrings.map((summary) => `- ${summary}`).join('\n') || 'No session highlights were captured.',
      },
      promotable_as: ['feature', 'bug', 'idea'],
    },
  };

  const reportFile = path.join(cwd, 'iris', 'pages', reportId, 'data.json');

  validateContract('report', report, reportFile);
  await writeAlways(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  await runRenderCommand(cwd, reportId);
  process.stdout.write(`created report ${reportId} from session ${source}\n`);
}
