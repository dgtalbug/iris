/**
 * The single list of assets the installed CLI reads at runtime, shared by
 * release verification and the install smoke test so a payload cannot be
 * required by one check and unverified by the other.
 */

/** Entries `package.json` must declare so the assets below reach the tarball. */
export const PACKAGE_FILES_ENTRIES = [
  'dist/src',
  'schemas',
  'templates/agents',
  'templates/project',
  'templates/research',
  'README.md',
];

/** npm packs these regardless of the `files` field. */
const ALWAYS_PACKED = ['package.json', 'README.md', 'LICENSE'];

/** Assets that live in the working tree and must be packed verbatim. */
export const SOURCE_ASSETS = [
  'schemas/bug.schema.json',
  'schemas/envelope.schema.json',
  'schemas/feature.schema.json',
  'schemas/idea.schema.json',
  'schemas/plan.schema.json',
  'schemas/report.schema.json',
  'templates/agents/iris-commands.md',
  'templates/agents/iris-workspace/SKILL.md',
  'templates/agents/iris-workspace/references/blueprint.md',
  'templates/agents/iris-workspace/references/components.md',
  'templates/agents/iris-guard/SKILL.md',
  'templates/research/blueprint.md',
  'templates/project/decisions.md',
  'templates/project/erd.md',
  'templates/project/hld.md',
  'templates/project/lld.md',
  'templates/project/overview.md',
];

/** Build outputs the installed binary loads; present only after a build. */
export const BUILD_ASSETS = [
  'dist/src/index.js',
  'dist/src/cli.js',
  'dist/src/lib/agent-skills.js',
  'dist/src/lib/project-docs.js',
  'dist/src/lib/runtime.js',
  'dist/src/lib/schemas.js',
];

/** Every path that must appear in a packed payload. */
export const PACKAGED_ASSETS = [...BUILD_ASSETS, ...SOURCE_ASSETS, 'package.json'];

function coveredByFilesField(asset, entries) {
  if (ALWAYS_PACKED.includes(asset)) return true;
  return entries.some((entry) => asset === entry || asset.startsWith(`${entry}/`));
}

/** Runtime assets a `files` field would leave out of the tarball. */
export function assetsMissingFromFilesField(files) {
  const entries = files ?? [];
  return PACKAGED_ASSETS.filter((asset) => !coveredByFilesField(asset, entries));
}

/** Runtime assets absent from the paths a packed payload actually contains. */
export function assetsMissingFromPayload(packedPaths) {
  const packed = new Set(packedPaths);
  return PACKAGED_ASSETS.filter((asset) => !packed.has(asset));
}
