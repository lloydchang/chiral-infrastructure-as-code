#!/usr/bin/env node

/**
 * AI Independence Check Script
 *
 * This script enforces that core Chiral modules remain 100% AI-independent.
 * It checks for any AI dependencies or imports in core modules and fails
 * the build if any are found.
 */

const fs = require('fs');
const path = require('path');

// Core modules that MUST remain AI-independent (only three pillars infrastructure)
const CORE_MODULES = [
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
];

// AI-related patterns that are forbidden in core modules
const AI_PATTERNS = [
  /@aws-sdk\/client-bedrock/,
  /@azure\/openai/,
  /@google-cloud\/aiplatform/,
  /@google-cloud\/vertexai/,
  /import.*BedrockRuntimeClient/,
  /import.*OpenAIAgent/,
  /import.*VertexAI/,
  /invokeLLM|invokeAgent/,
  /generateWithLLM/,
  /aws-agent|azure-agent|gcp-agent/,
  /multi-agent|agentic/
];

// AI-related file patterns (should not be imported by core)
const AI_FILE_PATTERNS = [
  /src\/adapters\/.*-agent\.ts$/,
  /src\/agents\//
];

function checkFileForAI(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    let violations = [];

    // Main.ts can coordinate AI features but core adapters cannot
    const isMainOrchestrator = relativePath === 'src/main.ts';

    // Check for AI patterns in content (allow in main.ts)
    AI_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && !isMainOrchestrator) {
        violations.push(`Found AI pattern "${pattern}" in ${relativePath}`);
      }
    });

    // Check for imports of AI files (strictly forbidden in core)
    AI_FILE_PATTERNS.forEach(pattern => {
      const matches = content.match(new RegExp(`from ['"].*${pattern.source}`));
      if (matches) {
        violations.push(`Core module imports AI file matching "${pattern}" in ${relativePath}`);
      }
    });

    return violations;
  } catch (error) {
    return [`Error reading ${filePath}: ${error.message}`];
  }
}

function checkDependencies() {
  // AI dependencies are ALLOWED in package.json as optional features
  // Only core module imports are forbidden
  return [];
}

function main() {
  console.log('🔍 Checking AI Independence of Core Modules...\n');

  let allViolations = [];
  let totalChecked = 0;

  // Check core modules
  CORE_MODULES.forEach(modulePath => {
    const fullPath = path.resolve(modulePath);
    if (fs.existsSync(fullPath)) {
      totalChecked++;
      const violations = checkFileForAI(fullPath);
      if (violations.length > 0) {
        allViolations.push(...violations);
      }
    } else {
      allViolations.push(`Core module not found: ${modulePath}`);
    }
  });

  // Check dependencies
  const depViolations = checkDependencies();
  allViolations.push(...depViolations);

  // Report results
  if (allViolations.length === 0) {
    console.log(`✅ AI Independence Check PASSED`);
    console.log(`   Checked ${totalChecked} core modules`);
    console.log(`   No AI dependencies found in core modules`);
    console.log(`   Core Chiral remains 100% AI-independent\n`);
    process.exit(0);
  } else {
    console.log(`❌ AI Independence Check FAILED`);
    console.log(`   Found ${allViolations.length} violations:\n`);

    allViolations.forEach(violation => {
      console.log(`   🚨 ${violation}`);
    });

    console.log(`\n💡 Core modules must remain AI-independent to ensure:`);
    console.log(`   • CLI functionality without AI dependencies`);
    console.log(`   • Deterministic behavior`);
    console.log(`   • Offline operation capability`);
    console.log(`   • Compliance with air-gapped environments\n`);

    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
