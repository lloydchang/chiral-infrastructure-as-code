// File: src/utils/pulumi-yaml.ts

// Utility functions for Pulumi YAML generation

import { PulumiConfig } from '../adapters/declarative/pulumi-adapter';

export function generatePulumiYaml(config: PulumiConfig): string {
  const yamlBlocks: string[] = [];

  // Pulumi project configuration
  yamlBlocks.push(`name: ${config.provider}-project
runtime: nodejs
description: Chiral Infrastructure Configuration

# Backend configuration (if provided)
${config.backend ? `backend:
  url: ${config.backend.type}
  options:
${Object.entries(config.backend.config)
  .map(([key, value]) => `    ${key}: ${JSON.stringify(value)}`)
  .join('\n')}
` : ''}

# Variables
variables:
${config.variables.map(v => `  ${v.name}: ${v.default ? JSON.stringify(v.default) : ''}${v.description ? ` # ${v.description}` : ''}${v.sensitive ? ' # sensitive' : ''}`).join('\n')}

# Resources
resources:
${config.resources.map(r => `  ${r.name}:
    type: ${r.type}
    properties:
${Object.entries(r.properties)
  .map(([key, value]) => `      ${key}: ${typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}`)
  .join('\n')}
${r.depends_on ? `    depends_on:\n${r.depends_on.map(d => `      - ${d}`).join('\n')}` : ''}`).join('\n\n')}

# Outputs
outputs:
${config.outputs ? Object.keys(config.outputs).map(outputName => `  ${outputName}:
    description: ${config.outputs![outputName].description}
    value: ${JSON.stringify(config.outputs![outputName].value)}`).join('\n') : ''}`);

  return yamlBlocks.join('\n');
}
