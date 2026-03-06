module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  env: {
    node: true,
    es6: true,
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',

    // AI Independence Enforcement Rules
    'no-restricted-imports': [
      'error',
      {
        paths: [
          // AI SDK imports forbidden in core modules
          { name: '@aws-sdk/client-bedrock-runtime', message: 'AI dependencies forbidden in core modules' },
          { name: '@azure/openai', message: 'AI dependencies forbidden in core modules' },
          { name: '@google-cloud/aiplatform', message: 'AI dependencies forbidden in core modules' },
          { name: '@google-cloud/vertexai', message: 'AI dependencies forbidden in core modules' }
        ],
        patterns: [
          // Agent file imports forbidden in core modules
          {
            group: ['**/adapters/*-agent.ts', '**/agents/**'],
            message: 'AI agent imports forbidden in core modules'
          }
        ]
      }
    ],

    // Custom rule to prevent AI function calls
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name=/^(invokeLLM|invokeAgent|generateWithLLM|generateWithAgent)$/]',
        message: 'AI function calls forbidden in core modules'
      },
      {
        selector: 'ImportDeclaration[source.value=/.*-agent/]',
        message: 'AI agent imports forbidden in core modules'
      }
    ],

    // General code quality rules
    'no-console': 'off', // Allow console.log for CLI tools
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    '*.js',
    '!jest.config.js',
    // Allow AI imports in agent-specific files
    'src/adapters/*-agent.ts',
    'src/agents/**',
  ],
  overrides: [
    // Core modules: Strict AI independence enforcement
    {
      files: [
        'src/adapters/programmatic/aws-cdk.ts',
        'src/adapters/declarative/azure-bicep.ts',
        'src/adapters/declarative/gcp-terraform.ts',
        'src/intent/index.ts',
        'src/validation.ts',
        'src/translation/hardware-map.ts',
        'src/main.ts',
        'src/cost-analysis.ts',
        'src/compliance.ts',
        'src/security-compliance.ts',
        'src/cloud-security-monitoring.ts'
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: '@aws-sdk/client-bedrock-runtime', message: 'AI dependencies strictly forbidden in core modules' },
              { name: '@azure/openai', message: 'AI dependencies strictly forbidden in core modules' },
              { name: '@google-cloud/aiplatform', message: 'AI dependencies strictly forbidden in core modules' },
              { name: '@google-cloud/vertexai', message: 'AI dependencies strictly forbidden in core modules' }
            ],
            patterns: [
              {
                group: ['**/adapters/*-agent.ts', '**/agents/**'],
                message: 'AI agent imports strictly forbidden in core modules'
              }
            ]
          }
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'CallExpression[callee.name=/^(invokeLLM|invokeAgent|generateWithLLM|generateWithAgent)$/]',
            message: 'AI function calls strictly forbidden in core modules'
          },
          {
            selector: 'ImportDeclaration[source.value=/.*-agent/]',
            message: 'AI agent imports strictly forbidden in core modules'
          }
        ]
      }
    }
  ]
};
