import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import {
  PACKAGE_FILES_ENTRIES,
  SOURCE_ASSETS,
  assetsMissingFromFilesField,
} from './packaged-assets.mjs';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const releaseTag = process.argv[2];
const expectedTag = `v${packageJson.version}`;

if (!releaseTag) {
  throw new Error(`Missing release tag; expected ${expectedTag}`);
}
if (releaseTag !== expectedTag) {
  throw new Error(`Release tag ${releaseTag} does not match package version ${expectedTag}`);
}
if (packageJson.private === true) {
  throw new Error('Package is marked private and cannot be published');
}
if (packageJson.publishConfig?.access !== 'public') {
  throw new Error('publishConfig.access must be public for the scoped package');
}
for (const requiredFile of PACKAGE_FILES_ENTRIES) {
  if (!packageJson.files?.includes(requiredFile)) {
    throw new Error(`Package payload is missing required files entry: ${requiredFile}`);
  }
}

const uncovered = assetsMissingFromFilesField(packageJson.files);
if (uncovered.length > 0) {
  throw new Error(`Package payload would omit initialization assets: ${uncovered.join(', ')}`);
}

for (const asset of SOURCE_ASSETS) {
  if (!existsSync(new URL(`../${asset}`, import.meta.url))) {
    throw new Error(`Package payload is missing the initialization asset: ${asset}`);
  }
}

const changelog = await readFile(new URL('../CHANGELOG.md', import.meta.url), 'utf8');
const versionSection = new RegExp(`^## \\[?${packageJson.version.replace(/\./g, '\\.')}\\]?`, 'm');
if (!versionSection.test(changelog)) {
  throw new Error(
    `CHANGELOG.md has no section for the version being released: ${packageJson.version}`,
  );
}

console.log(`release metadata verified for ${packageJson.name}@${packageJson.version}`);
