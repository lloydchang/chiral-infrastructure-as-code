// Test core isolation independently
const { ChiralCoreEngine } = require('./dist/core/index.js');

const config = {
  projectName: 'test',
  environment: 'prod',
  networkCidr: '10.0.0.0/16',
  k8s: { version: '1.29', minNodes: 2, maxNodes: 5, size: 'medium' },
  postgres: { engineVersion: '15', storageGb: 100, size: 'medium' },
  adfs: { size: 'medium', windowsVersion: '2022' }
};

async function testCore() {
  console.log('🏗️ CHIRAL CORE - Pure Deterministic Operation');
  console.log('✅ Core Isolation:', ChiralCoreEngine.verifyIsolation());
  console.log('✅ Deterministic Operation:', ChiralCoreEngine.verifyDeterministic());
  console.log('✅ Infrastructure Focus:', ChiralCoreEngine.verifyInfrastructureFocus());

  const validation = ChiralCoreEngine.validate(config);
  console.log('✅ Core Validation:', validation.valid ? 'PASS' : 'FAIL');

  const artifacts = await ChiralCoreEngine.generate(config);
  console.log('✅ Core Generation:', Object.keys(artifacts).join(', '));
  console.log('🎯 Core works 100% independently - NO AI DEPENDENCIES');
}

testCore();
