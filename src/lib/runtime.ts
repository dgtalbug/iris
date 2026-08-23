/**
 * Imported by `src/index.ts` before anything else and therefore must stay free
 * of every dependency, including `package.json`: the manifest lookup walks the
 * installed package root, which is one of the layouts this guard has to be able
 * to report on. The floor is duplicated here for the same reason and pinned to
 * `engines.node` by a test.
 */
export const SUPPORTED_NODE_VERSION = '22.13.0';

export const ENVIRONMENT_EXIT_CODE = 2;

function numericSegments(version: string): number[] {
  return version.split('.').map((segment) => Number.parseInt(segment, 10));
}

/**
 * Returns the message to print, or `null` when the runtime is supported, so the
 * entry point owns the stream and the exit code.
 */
export function assertSupportedNode(version: string): string | null {
  const found = numericSegments(version);
  const floor = numericSegments(SUPPORTED_NODE_VERSION);

  // An unparseable version cannot be shown to satisfy the floor, so it is
  // reported rather than assumed good.
  let supported = !found.some(Number.isNaN);
  if (supported) {
    for (let index = 0; index < floor.length; index += 1) {
      const segment = found[index] ?? 0;
      if (segment > floor[index]) break;
      if (segment < floor[index]) {
        supported = false;
        break;
      }
    }
  }

  if (supported) return null;
  return (
    `Unsupported Node.js ${version}; iris requires Node.js ${SUPPORTED_NODE_VERSION} or newer. ` +
    `Install a supported Node.js release and run iris again.`
  );
}
