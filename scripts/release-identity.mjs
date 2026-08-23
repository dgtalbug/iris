/**
 * Derives everything a release needs from one input: the tag being released.
 * Keeping this out of the workflow means the rules are unit-testable rather
 * than only observable by cutting a real release.
 */
import { readFile, writeFile } from 'node:fs/promises';

/** `latest` for a stable version, otherwise the prerelease identifier. */
export function distTag(version) {
  const prerelease = version.split('-')[1];
  if (prerelease === undefined || prerelease === '') return 'latest';
  return prerelease.split('.')[0];
}

export function isPrerelease(version) {
  return version.includes('-');
}

/** The section a `## [<version>]` heading owns, up to the next `## ` heading. */
export function releaseNotes(changelog, version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const heading = new RegExp(`^## \\[?${escaped}\\]?.*$`, 'm');
  const start = changelog.match(heading);
  if (start?.index === undefined) return null;
  const rest = changelog.slice(start.index + start[0].length);
  const next = rest.search(/^## /m);
  return `${start[0]}\n${(next === -1 ? rest : rest.slice(0, next)).trim()}\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = new URL('../', import.meta.url);
  const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const version = packageJson.version;
  // A manual dispatch has no tag, so it verifies against the manifest instead.
  const tag = process.env.RELEASE_TAG || `v${version}`;

  const notes = releaseNotes(await readFile(new URL('CHANGELOG.md', root), 'utf8'), version);
  if (notes === null) {
    throw new Error(`CHANGELOG.md has no section for the version being released: ${version}`);
  }
  const notesFile = `${process.env.RUNNER_TEMP || '.'}/release-notes.md`;
  await writeFile(notesFile, notes);

  process.stdout.write(
    [
      `tag=${tag}`,
      `version=${version}`,
      `dist_tag=${distTag(version)}`,
      `prerelease=${isPrerelease(version)}`,
      `notes_file=${notesFile}`,
      '',
    ].join('\n'),
  );
}
