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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Core modules must have high coverage - no AI dependencies allowed
    './src/adapters/programmatic/aws-cdk.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/adapters/declarative/azure-bicep.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/adapters/declarative/gcp-terraform.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/intent/index.ts': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    },
    './src/validation.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/translation/hardware-map.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/main.ts': {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/agent-integration.test.ts' // Exclude AI agent integration tests from core coverage
  ]
};
