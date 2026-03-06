#!/usr/bin/env node

// File: scripts/enforce-core-isolation.js

// =================================================================
// PERMANENT CORE ISOLATION ENFORCEMENT
// =================================================================
// PURPOSE: Guarantee Chiral core remains 100% independent forever
// PRINCIPLE: Core = Three Pillars Only (K8s, Postgres, ADFS)
// =================================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 ENFORCING PERMANENT CORE ISOLATION');
console.log('=====================================');

/**
 * CORE MODULES - MUST NEVER IMPORT FROM OUTER LAYERS
 */
const CORE_MODULES = [
  'src/core/index.ts',
  'src/intent/index.ts',
  'src/validation.ts',
  'src/adapters/programmatic/aws-cdk.ts',
  'src/adapters/declarative/azure-bicep.ts',
  'src/adapters/declarative/gcp-terraform.ts',
  'src/cost-analysis.ts',
  'src/compliance.ts',
  'src/security-compliance.ts',
  'src/cloud-security-monitoring.ts',
  'src/migration/wizard.ts',
  'src/migration/playbooks.ts',
  'src/migration/validation-scripts.ts',
  'src/cli/core-commands.ts'
];

/**
 * FORBIDDEN IMPORTS - CORE MUST NEVER IMPORT THESE
 */
const FORBIDDEN_IMPORT_PATTERNS = [
  // AI Agents
  /from ['"']\.?\.\/agents\//,
  /from ['"']\.?\.\/adapters\/.*-agent['"']/,
  /import.*from ['"']\.?\.\/agents\//,
  /import.*from ['"']\.?\.\/adapters\/.*-agent['"']/,

  // Skills
  /skills\.md/,
  /skill.*intent/i,
  /\bskills\b/i,

  // Traffic Enforcement (Outer Layer)
  /from ['"']\.?\.\/migration\/traffic-/,
  /from ['"']\.?\.\/cli\/traffic-/,
  /import.*traffic/i,

  // Any AI SDKs
  /@aws-sdk\/client-bedrock-runtime/,
  /@azure\/openai/,
  /@google-cloud\/aiplatform/,
  /@google-cloud\/vertexai/,
  /openai/,
  /anthropic/
];

/**
 * ALLOWED CORE COMPONENTS - ONLY THESE
 */
const ALLOWED_CORE_COMPONENTS = [
  'k8s', 'kubernetes', 'postgres', 'postgresql', 'adfs', 'active.*directory',
  'network', 'vpc', 'security', 'compliance', 'cost', 'migration',
  'validation', 'drift', 'monitoring'
];

/**
 * ENFORCE: Check all core modules for forbidden imports
 */
function enforceCoreIsolation() {
  console.log('\n🔍 Checking Core Module Isolation...');

  let violations = [];

  for (const modulePath of CORE_MODULES) {
    const fullPath = path.resolve(modulePath);

    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  WARNING: Core module ${modulePath} does not exist`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Check for forbidden imports
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        violations.push({
          module: modulePath,
          violation: `Forbidden import: ${matches[0]}`,
          pattern: pattern.toString()
        });
      }
    }

    // Check for skills references (should not exist in core)
    const skillRefs = content.match(/\bskills?\b/gi);
    if (skillRefs && skillRefs.length > 0) {
      // Allow in comments or documentation that explicitly mention skills are outer layer
      const nonCommentSkillRefs = skillRefs.filter(ref => {
        const line = content.substring(
          Math.max(0, content.indexOf(ref) - 50),
          content.indexOf(ref) + ref.length + 50
        );
        return !line.includes('MOVED TO OUTER LAYER') &&
               !line.includes('outer layer agents') &&
               !line.includes('Skills are no longer');
      });

      if (nonCommentSkillRefs.length > 0) {
        violations.push({
          module: modulePath,
          violation: `Core module contains skill references: ${nonCommentSkillRefs.join(', ')}`
        });
      }
    }
  }

  if (violations.length > 0) {
    console.log('\n❌ CORE ISOLATION VIOLATIONS DETECTED:');
    violations.forEach(v => {
      console.log(`   🚫 ${v.module}: ${v.violation}`);
    });
    console.log('\n💡 FIX: Remove all outer layer dependencies from core modules');
    console.log('   Core must only handle: K8s, Postgres, ADFS infrastructure');
    return false;
  }

  console.log('✅ Core isolation verified - no forbidden imports found');
  return true;
}

/**
 * ENFORCE: Verify core intent schema only has three pillars
 */
function enforceThreePillarsOnly() {
  console.log('\n🏗️  Checking Three Pillars Focus...');

  const intentPath = path.resolve('src/intent/index.ts');
  const content = fs.readFileSync(intentPath, 'utf8');

  // Check ChiralSystem interface - use more robust parsing for complex nested structure
  const interfaces = content.split(/export interface /);
  const chiralSystemInterface = interfaces.find(i => i.startsWith('ChiralSystem'));

  if (!chiralSystemInterface) {
    console.log('❌ Could not find ChiralSystem interface');
    return false;
  }

  // Parse the interface content by counting braces
  const braceStart = chiralSystemInterface.indexOf('{');
  let braceCount = 0;
  let endIndex = braceStart;

  for (let i = braceStart; i < chiralSystemInterface.length; i++) {
    if (chiralSystemInterface[i] === '{') braceCount++;
    if (chiralSystemInterface[i] === '}') braceCount--;
    if (braceCount === 0) {
      endIndex = i;
      break;
    }
  }

  const interfaceContent = chiralSystemInterface.substring(braceStart + 1, endIndex);

  // Must have exactly three pillars
  const hasK8s = interfaceContent.includes('k8s: KubernetesIntent;');
  const hasPostgres = interfaceContent.includes('postgres: DatabaseIntent;');
  const hasAdfs = interfaceContent.includes('adfs: AdfsIntent;');

  // Must NOT have skills
  const hasSkills = interfaceContent.includes('skills:') || interfaceContent.includes('skills?:');

  if (!hasK8s || !hasPostgres || !hasAdfs) {
    console.log('❌ ChiralSystem missing required three pillars');
    return false;
  }

  if (hasSkills) {
    console.log('❌ ChiralSystem still contains skills - must be removed from core');
    return false;
  }

  console.log('✅ Three pillars verified - K8s, Postgres, ADFS only');
  return true;
}

/**
 * ENFORCE: Verify core builds and works independently
 */
function enforceCoreBuildIndependence() {
  console.log('\n⚙️  Testing Core Build Independence...');

  try {
    // Test core-only build
    execSync('npm run build:core-only', { stdio: 'pipe' });
    console.log('✅ Core builds successfully without outer layers');
  } catch (error) {
    console.log('❌ Core build failed:', error.message);
    return false;
  }

  try {
    // Test AI independence
    execSync('npm run check-ai-independence', { stdio: 'pipe' });
    console.log('✅ Core is AI-independent');
  } catch (error) {
    console.log('❌ AI independence check failed:', error.message);
    return false;
  }

  return true;
}

/**
 * ENFORCE: Verify core CLI works without outer layers
 */
function enforceCoreCliIndependence() {
  console.log('\n🖥️  Testing Core CLI Independence...');

  try {
    // Test core compile command (should not require any AI or agents)
    const testConfig = {
      projectName: 'test-core',
      environment: 'dev',
      networkCidr: '10.0.0.0/16',
      k8s: { version: '1.29', minNodes: 1, maxNodes: 2, size: 'small' },
      postgres: { engineVersion: '15', storageGb: 20, size: 'small' },
      adfs: { size: 'small', windowsVersion: '2022' }
    };

    fs.writeFileSync('/tmp/test-core-config.json', JSON.stringify(testConfig, null, 2));

    // This should work without any outer layer dependencies
    execSync('node dist/main.js core compile -c /tmp/test-core-config.json -o /tmp/core-test-output', { stdio: 'pipe' });

    console.log('✅ Core CLI works independently');

    // Cleanup
    fs.unlinkSync('/tmp/test-core-config.json');
    if (fs.existsSync('/tmp/core-test-output')) {
      fs.rmSync('/tmp/core-test-output', { recursive: true, force: true });
    }

    return true;
  } catch (error) {
    console.log('❌ Core CLI independence test failed:', error.message);
    return false;
  }
}

/**
 * MAIN ENFORCEMENT FUNCTION
 */
function enforcePermanentSeparation() {
  console.log('🚫 OUTER LAYER DEPENDENCIES FORBIDDEN IN CORE');
  console.log('📋 Core = Three Pillars Infrastructure Only');
  console.log('🔄 Skills & AI = Outer Layer Agents Only');

  let allPassed = true;

  // Run all enforcement checks
  allPassed &= enforceCoreIsolation();
  allPassed &= enforceThreePillarsOnly();
  allPassed &= enforceCoreBuildIndependence();
  allPassed &= enforceCoreCliIndependence();

  if (allPassed) {
    console.log('\n🎉 PERMANENT SEPARATION ENFORCED');
    console.log('================================');
    console.log('✅ Core remains 100% independent');
    console.log('✅ Three pillars focus maintained');
    console.log('✅ No outer layer contamination');
    console.log('✅ Build and CLI independence verified');
    console.log('\n🔒 Chiral core is permanently isolated');
    process.exit(0);
  } else {
    console.log('\n❌ PERMANENT SEPARATION VIOLATED');
    console.log('=================================');
    console.log('💡 Fix violations and re-run enforcement');
    console.log('   Core must work with ZERO outer layer dependencies');
    process.exit(1);
  }
}

// Run enforcement
enforcePermanentSeparation();
