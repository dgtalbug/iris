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
import { IrisError } from './lib/errors.js';

const ALL_COMMANDS = [
  'init',
  'render',
  'report',
  'publish',
  'feature',
  'bug',
  'idea',
  'plan',
  'promote',
  'archive',
  'export',
  'vendor',
  'open',
  'update',
] as const;

export const HELP_TEXT = `iris v0.1
Usage: iris <command> [options]

Commands:
${ALL_COMMANDS.map((command) => `  - ${command}`).join('\n')}
`;

export async function runCli(argv: string[], cwd = process.cwd()): Promise<number> {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      help: { type: 'boolean', short: 'h' },
      json: { type: 'boolean' },
      all: { type: 'boolean', short: 'a' },
      'from-session': { type: 'string' },
      output: { type: 'string', short: 'o' },
      single: { type: 'boolean' },
      png: { type: 'boolean' },
      pdf: { type: 'boolean' },
    },
  });

  if (parsed.values.help || parsed.positionals.length === 0) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }

  const [command, id] = parsed.positionals;

  try {
    switch (command) {
      case 'init':
        await runInitCommand(cwd);
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
        process.stderr.write(`Command '${command}' is registered but not yet implemented in M0.\n`);
        return 1;
      case 'update':
        await runUpdateCommand(cwd);
        return 0;
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
