import { parseArgs } from 'node:util';
import { runDraftCommand } from './commands/draft.js';
import { runExportCommand, type ExportMode } from './commands/export.js';
import { runInitCommand } from './commands/init.js';
import { runArchiveCommand, runUpdateCommand } from './commands/lifecycle.js';
import { runOpenCommand } from './commands/open.js';
import { runPublishCommand } from './commands/publish.js';
import { runRenderCommand } from './commands/render.js';
import { runReportFromSessionCommand } from './commands/report.js';
import { runVendorCommand } from './commands/vendor.js';
import { helpText } from './lib/command-catalog.js';
import { IrisError } from './lib/errors.js';
import { packageVersion } from './lib/package-info.js';
import { getUserConfigValue, setUserConfigValue, type UserConfig } from './lib/user-config.js';

const CLI_OPTIONS = {
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  json: { type: 'boolean' },
  all: { type: 'boolean', short: 'a' },
  'from-session': { type: 'string' },
  output: { type: 'string', short: 'o' },
  single: { type: 'boolean' },
  png: { type: 'boolean' },
  pdf: { type: 'boolean' },
  global: { type: 'boolean' },
  tools: { type: 'string' },
  yes: { type: 'boolean', short: 'y' },
  interactive: { type: 'boolean' },
  index: { type: 'boolean' },
  'no-index': { type: 'boolean' },
} as const;

const CONFIG_KEYS = new Set<keyof UserConfig>(['theme', 'agent', 'tools', 'indexing', 'dashboard']);

function parseConfigValue(key: keyof UserConfig, raw: string): unknown {
  if (key === 'tools') {
    return raw
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  if (key === 'indexing') {
    return { enabled: raw === 'true' || raw === 'on' || raw === '1' };
  }
  if (key === 'agent') {
    return raw === '' || raw === 'null' ? null : raw;
  }
  if (key === 'dashboard') {
    return { generated: raw === '' || raw === 'null' ? null : raw };
  }
  return raw;
}

async function runConfigCommand(args: string[], global: boolean): Promise<number> {
  const [key, ...rest] = args;
  if (!key || !CONFIG_KEYS.has(key as keyof UserConfig)) {
    throw new IrisError(
      1,
      `Unknown config key '${key ?? ''}'. Valid keys: ${[...CONFIG_KEYS].join(', ')}.`,
    );
  }
  const configKey = key as keyof UserConfig;
  if (rest.length === 0) {
    const value = await getUserConfigValue(configKey);
    process.stdout.write(`${JSON.stringify(value)}\n`);
    return 0;
  }
  if (!global) {
    throw new IrisError(
      1,
      `Writing config requires --global. Run 'iris config --global ${key} <value>' to set it.`,
    );
  }
  const raw = rest.join(' ');
  const parsed = parseConfigValue(configKey, raw);
  await setUserConfigValue(configKey, parsed as UserConfig[typeof configKey]);
  process.stdout.write(`${key} = ${JSON.stringify(parsed)}\n`);
  return 0;
}

/** Evaluated per call so a broken package layout exits through the error path
 * below instead of throwing while this module is being imported. */
export function cliHelpText(): string {
  return helpText(packageVersion());
}

/**
 * `parseArgs` is strict, so an unrecognized token throws an `ERR_PARSE_ARGS_*`
 * error that would escape every handler unless it is translated here.
 */
function parseCliArgs(argv: string[]) {
  try {
    return parseArgs({ args: argv, allowPositionals: true, options: CLI_OPTIONS });
  } catch (error) {
    const parseError = error as NodeJS.ErrnoException;
    const message = parseError.message ?? String(error);
    const token = message.match(/'([^']+)'/)?.[1];
    const detail =
      parseError.code === 'ERR_PARSE_ARGS_UNKNOWN_OPTION' && token
        ? `Unknown option: ${token}`
        : message.split('. ')[0];
    throw new IrisError(1, `${detail}. Run 'iris --help' for the supported commands and options.`);
  }
}

export async function runCli(argv: string[], cwd = process.cwd()): Promise<number> {
  try {
    const parsed = parseCliArgs(argv);

    if (parsed.values.version) {
      process.stdout.write(`${packageVersion()}\n`);
      return 0;
    }

    if (parsed.values.help || parsed.positionals.length === 0) {
      process.stdout.write(cliHelpText());
      return 0;
    }

    const [command, id] = parsed.positionals;

    switch (command) {
      case 'init':
        await runInitCommand(cwd, {
          json: parsed.values.json === true,
          yes: parsed.values.yes === true,
          interactive: parsed.values.interactive === true,
          tools: parsed.values.tools,
          index: parsed.values.index === true,
          noIndex: parsed.values['no-index'] === true,
        });
        return 0;
      case 'render':
        if (parsed.values.all && id) {
          throw new IrisError(1, "Choose either '<id>' or '--all' for the render command");
        }
        await runRenderCommand(cwd, parsed.values.all ? undefined : id, {
          refreshOpenSpec: parsed.values.all || !id,
        });
        return 0;
      case 'publish':
        await runPublishCommand(cwd, id, parsed.values.output);
        return 0;
      case 'report':
        if (parsed.values['from-session']) {
          await runReportFromSessionCommand(cwd, parsed.values['from-session'], id);
          return 0;
        }
        if (!id) {
          throw new IrisError(1, "Missing id for command 'report'");
        }
        await runDraftCommand(cwd, 'report', id);
        return 0;
      case 'feature':
      case 'bug':
      case 'idea':
      case 'plan':
      case 'research':
        if (!id) {
          throw new IrisError(1, `Missing id for command '${command}'`);
        }
        await runDraftCommand(cwd, command, id);
        return 0;
      case 'archive':
        await runArchiveCommand(cwd, id);
        return 0;
      case 'export': {
        const modes = (['single', 'png', 'pdf'] as const).filter((mode) => parsed.values[mode]);
        if (modes.length > 1) {
          throw new IrisError(1, 'Choose only one export mode: --single, --png, or --pdf');
        }
        await runExportCommand(cwd, id, {
          mode: modes[0] as ExportMode | undefined,
          outputPath: parsed.values.output,
        });
        return 0;
      }
      case 'open':
        await runOpenCommand(cwd);
        return 0;
      case 'vendor':
        await runVendorCommand(cwd);
        return 0;
      case 'promote':
        process.stderr.write(
          `Command '${command}' is registered but not implemented yet; see iris/commands.html for the current status.\n`,
        );
        return 1;
      case 'update':
        await runUpdateCommand(cwd);
        return 0;
      case 'config':
        return await runConfigCommand(parsed.positionals.slice(1), parsed.values.global === true);
      default:
        throw new IrisError(1, `Unknown command: ${command}`);
    }
  } catch (error) {
    if (error instanceof IrisError) {
      process.stderr.write(`${error.message}\n`);
      return error.code;
    }

    process.stderr.write(`Unexpected error: ${(error as Error).message}\n`);
    return 2;
  }
}
