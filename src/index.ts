#!/usr/bin/env node
import { ENVIRONMENT_EXIT_CODE, assertSupportedNode } from './lib/runtime.js';

const unsupported = assertSupportedNode(process.versions.node);
if (unsupported !== null) {
  process.stderr.write(`${unsupported}\n`);
  process.exit(ENVIRONMENT_EXIT_CODE);
}

// Deferred so the guard above runs before any other Iris module is parsed.
const { runCli } = await import('./cli.js');
const code = await runCli(process.argv.slice(2));
process.exit(code);
