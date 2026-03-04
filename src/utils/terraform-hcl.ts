// File: src/utils/terraform-hcl.ts

// Utility functions for Terraform HCL generation

import { TerraformConfig } from '../adapters/declarative/terraform-adapter';

export function generateTerraformHcl(config: TerraformConfig): string {
  const hclBlocks: string[] = [];

  // Provider configuration
  hclBlocks.push(`terraform {
  required_version = ">= 1.0"
  required_providers {
    ${config.provider} = {
      source = "hashicorp/${config.provider}"
      version = "~> 4.0"
    }
  }
}`);

  // Backend configuration (if provided)
  if (config.backend) {
    hclBlocks.push(`
backend "${config.backend.type}" {
${Object.entries(config.backend.config)
  .map(([key, value]) => `    ${key} = ${JSON.stringify(value)}`)
  .join('\n')}
}`);
  }

  // Variables
  if (config.variables.length > 0) {
    hclBlocks.push(`
variables {
${config.variables.map(v => `  ${v.name} = ${v.default ? JSON.stringify(v.default) : ''}${v.description ? ` # ${v.description}` : ''}${v.sensitive ? ' # sensitive' : ''}`).join('\n')}
}`);
  }

  // Resources
  if (config.resources.length > 0) {
    hclBlocks.push(`
resource "${config.resources[0].type}" "${config.resources[0].name}" {
${Object.entries(config.resources[0].properties)
  .map(([key, value]) => `  ${key} = ${typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}`)
  .join('\n')}
${config.resources[0].depends_on ? `  depends_on = [${config.resources[0].depends_on.join(', ')}]` : ''}
}`);
  }

  // Modules
  if (config.modules.length > 0) {
    hclBlocks.push(`
module "main" {
  source = "${config.modules[0].source}"
  version = "${config.modules[0].version || 'latest'}"
${Object.entries(config.modules[0].variables || {})
  .map(([key, value]) => `  ${key} = ${JSON.stringify(value)}`)
  .join('\n')}
}`);
  }

  // Outputs
  if (Object.keys(config.outputs || {}).length > 0) {
    hclBlocks.push(`
output "${Object.keys(config.outputs)[0]}" {
  description = "${config.outputs[Object.keys(config.outputs)[0]].description}"
  value = ${JSON.stringify(config.outputs[Object.keys(config.outputs)[0]].value)}
}`);
  }

  return hclBlocks.join('\n\n');
}
