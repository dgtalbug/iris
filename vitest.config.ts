import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // `tsc` emits compiled copies of the suite to dist/tests; without an explicit
    // include they are collected as a second, broken copy of every test.
    include: ['tests/**/*.test.{ts,mts,js,mjs}'],
  },
});
