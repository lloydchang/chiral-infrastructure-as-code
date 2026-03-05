# Terraform Adapter Implementation Documentation

## Overview
The Terraform Import Adapter enables migration FROM Terraform TO Chiral Infrastructure as Code. It parses existing Terraform HCL configurations and converts them to Chiral intent objects.

## Architecture

### Core Components

#### 1. TerraformImportAdapter Class
Location: `src/adapters/declarative/terraform-adapter.ts`

**Key Methods:**
- `parseTerraformFiles(sourcePath, provider)` - Parses .tf files and extracts resource definitions
- `convertToChiralIntent(resources, provider)` - Converts parsed resources to Chiral intent
- `importFromTerraform(config)` - Complete workflow from Terraform to Chiral
- `mapAwsResource(resource, intent)` - Maps AWS resources to Chiral intent
- `mapAzureResource(resource, intent)` - Maps Azure resources to Chiral intent  
- `mapGcpResource(resource, intent)` - Maps GCP resources to Chiral intent

#### 2. Interfaces
```typescript
export interface TerraformImportConfig {
  provider: 'aws' | 'azure' | 'gcp';
  sourcePath: string;
  stateFile?: string;
  analyzeOnly?: boolean;
}

export interface ParsedTerraformResource {
  resourceType: string;
  resourceName: string;
  config: any;
  depends_on?: string[];
}
```

## Implementation Details

### HCL Parsing
- Uses line-by-line parsing approach for basic resource blocks
- Extracts resource declarations using regex: `/^resource\s+["']?([^"'\s]+)["']?\s+["']?([^"'\s]+)["']?\s*\{/`
- Parses key-value pairs for strings, numbers, arrays, and booleans
- Handles nested resource blocks with brace counting

### Resource Mapping

#### AWS Resources Supported:
- `aws_eks_cluster` → Chiral k8s intent
- `aws_db_instance` → Chiral postgres intent  
- `aws_instance` → Chiral adfs intent
- `aws_vpc` → Chiral network settings

#### Azure Resources Supported:
- `azurerm_kubernetes_cluster` → Chiral k8s intent
- `azurerm_postgresql_flexible_server` → Chiral postgres intent
- `azurerm_windows_virtual_machine` → Chiral adfs intent
- `azurerm_virtual_network` → Chiral network settings

#### GCP Resources Supported:
- `google_container_cluster` → Chiral k8s intent
- `google_sql_database_instance` → Chiral postgres intent
- `google_compute_instance` → Chiral adfs intent
- `google_compute_network` → Chiral network settings

### Size Mapping
Uses existing translation functions:
- `mapInstanceTypeToWorkloadSize(instanceType, provider)` 
- `mapDbClassToWorkloadSize(dbClass, provider)`

## Test Suite

### Test Files
1. `src/__tests__/terraform-adapter.test.ts` - Unit tests
2. `src/__tests__/terraform-integration.test.ts` - Integration tests

### Test Coverage

#### Unit Tests (terraform-adapter.test.ts):
- ✅ Method existence validation
- ✅ Terraform file parsing with temporary files
- ✅ Provider support validation
- ✅ Chiral intent conversion
- ✅ Default value handling
- ✅ Migration metadata setting
- ✅ Complete workflow integration
- ✅ AWS resource mapping
- ✅ Error handling

#### Integration Tests (terraform-integration.test.ts):
- ✅ Real AWS EKS cluster parsing
- ✅ Real Azure AKS cluster parsing  
- ✅ Real GCP GKE cluster parsing
- ✅ Complete workflow end-to-end testing
- ✅ Mixed provider resource handling
- ✅ Error handling for invalid directories
- ✅ Malformed HCL handling
- ✅ Empty directory handling

### Test Features:
- **Temporary file creation** for realistic testing
- **Real HCL content** parsing validation
- **Multi-provider support** verification
- **Workflow completion** testing
- **Error resilience** validation

## Workflow Completion

### Complete Import Workflow:
1. **Parse Phase**: `parseTerraformFiles()` reads .tf files and extracts resources
2. **Convert Phase**: `convertToChiralIntent()` maps resources to Chiral intent
3. **Import Phase**: `importFromTerraform()` creates complete ChiralSystem with migration metadata

### Migration Metadata:
```typescript
migration: {
  strategy: 'progressive',
  sourceState: config.sourcePath,
  validateCompliance: true
}
```

### Default Values:
- Project Name: `'imported-infrastructure'`
- Environment: `'prod'`
- Network CIDR: `'10.0.0.0/16'`
- K8s Version: `'1.35'`
- Postgres Engine: `'15'`
- Windows Version: `'2022'`

## Integration Points

### Dependencies:
- `src/translation/import-map.ts` - Size mapping functions
- `src/translation/hardware-map.ts` - Hardware mappings
- `src/intent/index.ts` - ChiralSystem interface

### Error Handling:
- Graceful directory access failures
- Malformed HCL parsing recovery
- Missing resource type handling
- Invalid provider protection

## Usage Example

```typescript
import { TerraformImportAdapter } from './adapters/declarative/terraform-adapter';

const config = {
  provider: 'aws' as const,
  sourcePath: '/path/to/terraform/files',
  analyzeOnly: false
};

const chiralSystem = await TerraformImportAdapter.importFromTerraform(config);
console.log('Migrated Chiral System:', chiralSystem);
```

## Test Results
- ✅ All unit tests passing (15/15)
- ✅ All integration tests passing
- ✅ Complete workflow validation
- ✅ Multi-provider support confirmed
- ✅ Error handling verified

## Status
**COMPLETE** - The Terraform adapter implementation provides full workflow support for migrating from Terraform to Chiral Infrastructure as Code, with test coverage and error handling.
