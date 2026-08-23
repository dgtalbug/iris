// CI entry for the provenance denylist scan. Usage: node scripts/provenance-lint.mjs [root]
// Exits 1 on any non-allowlisted hit, 0 when the scanned surfaces are clean.
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), '..');
const root = path.resolve(process.argv[2] ?? repoRoot);

// The scanner is TypeScript. Node strips types natively from 22.18 on; the
// 22.13 floor needs the flag, so the first import failure re-execs once with
// type stripping enabled.
let provenance;
try {
  provenance = await import(pathToFileURL(path.join(repoRoot, 'src/lib/provenance.ts')).href);
} catch (error) {
  if (error?.code === 'ERR_UNKNOWN_FILE_EXTENSION' && process.env.IRIS_PROVENANCE_REEXEC !== '1') {
    const retry = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--no-warnings', scriptPath, ...process.argv.slice(2)],
      { stdio: 'inherit', env: { ...process.env, IRIS_PROVENANCE_REEXEC: '1' } },
    );
    process.exit(retry.status ?? 1);
  }
  throw error;
}

let findings;
try {
  findings = await provenance.scan(provenance.DEFAULT_SCAN_TARGETS, { cwd: root });
} catch (error) {
  console.error(`provenance-lint: ${error.message}`);
  process.exit(1);
}

for (const finding of findings) {
  const managed = finding.managed ? ' [managed — regenerate the surface]' : '';
  console.error(
    `provenance-lint: ${finding.file}:${finding.line}: '${finding.match}'${managed} — ${finding.suggestion}`,
  );
}

if (findings.length > 0) {
  console.error(`provenance-lint: ${findings.length} finding(s)`);
  process.exit(1);
}

console.log('provenance-lint: clean');
