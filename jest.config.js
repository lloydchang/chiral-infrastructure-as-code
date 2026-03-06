module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/agent*.ts', // Exclude agent files from core coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    // Core modules must have 100% coverage - no AI dependencies allowed
    './src/adapters/programmatic/aws-cdk.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/adapters/declarative/azure-bicep.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/adapters/declarative/gcp-terraform.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/intent/index.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/validation.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/translation/hardware-map.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    './src/main.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/agent-integration.test.ts' // Exclude AI agent integration tests from core coverage
  ]
};
