# Basic Chiral Setup Guide

This directory contains a minimal example for setting up a new Chiral project from scratch.

## Example: minimal-chiral-setup/

- `minimal-config.ts`: Simple Chiral configuration for getting started
- `basic-intent.ts`: Minimal intent interfaces for basic use case

This example demonstrates the simplest possible Chiral setup for learning and quick start scenarios.

## Basic Setup Steps

### Step 1: Define Minimal Intent
Create basic intent interfaces for your use case:
```typescript
export interface BasicChiralSystem {
  projectName: string;
  environment: 'dev' | 'prod';
  networkCidr: string;
  k8s: {
    version: string;
    minNodes: number;
    maxNodes: number;
    size: 'small' | 'large';
  };
  postgres: {
    engineVersion: string;
    size: 'small' | 'large';
    storageGb: number;
  };
}
```

### Step 2: Create Simple Configuration
```typescript
export const minimalConfig: BasicChiralSystem = {
  projectName: 'minimal-app',
  environment: 'dev',
  networkCidr: '10.0.0.0/16',
  k8s: {
    version: '1.29',
    minNodes: 2,
    maxNodes: 5,
    size: 'small'
  },
  postgres: {
    engineVersion: '15',
    size: 'small',
    storageGb: 20
  }
};
```

### Step 3: Implement Minimal Adapters
- Create basic AWS adapter with essential resources only
- Create basic Azure adapter with core functionality
- Focus on learning patterns, not production features

### Step 4: Test Basic Workflow
- Run `npm run compile` to generate templates
- Validate outputs match expectations
- Iterate with additional resources as needed

### When to Use This Example

- **Learning**: New to Chiral pattern concepts
- **Prototyping**: Quick infrastructure setup
- **Testing**: Validating Chiral workflow
- **Simple Projects**: Basic multi-cloud needs

### Next Steps

After mastering this basic setup, progress to:
1. **Full Chiral System**: Complete intent and adapters
2. **Advanced Features**: Security, monitoring, backups
3. **Production Patterns**: Enterprise-grade configurations

This minimal example provides a gentle introduction to Chiral pattern without overwhelming complexity.
