import { pathsToModuleNameMapper as pathAdapter } from 'ts-jest';

import { compilerOptions } from './tsconfig.json';

const prefix = '<rootDir>/../../';
const mapper = pathAdapter(compilerOptions.paths, { prefix });

export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src/core',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          target: 'es2021'
        },
        sourceMaps: 'inline'
      }
    ]
  },
  setupFilesAfterEnv: ['../../test/initialization.ts'],
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.ts'],
  coverageDirectory: '../../coverage',
  coverageReporters: ['json-summary', 'lcov'],
  moduleNameMapper: mapper
};
