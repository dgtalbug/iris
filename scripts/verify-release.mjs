import { readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const releaseTag = process.argv[2];
const expectedTag = `v${packageJson.version}`;
const requiredFiles = ['dist/src', 'schemas', 'templates/agents', 'README.md'];

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
for (const requiredFile of requiredFiles) {
  if (!packageJson.files?.includes(requiredFile)) {
    throw new Error(`Package payload is missing required files entry: ${requiredFile}`);
  }
}

console.log(`release metadata verified for ${packageJson.name}@${packageJson.version}`);
