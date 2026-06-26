/**
 * Pure-logic unit tests. We use the jest-expo preset for TS/Babel transforms
 * but only test side-effect-free modules (no React Native components), so the
 * native module graph never loads.
 */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/*.test.ts'],
};
