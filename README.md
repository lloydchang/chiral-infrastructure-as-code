# Chiral Infrastructure as Code

**One Intent, Many Clouds: Native IaC Generation**

> **Solving [multi-cloud infrastructure's enterprise challenges](docs/CHALLENGES.md)**: Different native cloud IaCs, state management complexity, and third-party vendor lock-in make functionally uniform deployments across AWS, Azure, and GCP challenging. **Chiral generates native cloud artifacts from a single intent schema**, ensuring functional uniformity through optimal trade-offs.

---

## Installation

```bash
npm install -g chiral-infrastructure-as-code
```

## Usage

Create a config file (e.g., `config.js` or `config.ts`):

```javascript
module.exports = {
  projectName: 'myproject',
  environment: 'dev',
  networkCidr: '10.0.0.0/16',
  k8s: {
    version: '1.28',
    minNodes: 1,
    maxNodes: 3,
    size: 'small'
  },
  postgres: {
    engineVersion: '15',
    storageGb: 20,
    size: 'small'
  },
  adfs: {
    size: 'small',
    windowsVersion: '2022'
  }
};
```

**Key Features:**
- **minNodes/maxNodes**: Controls Kubernetes cluster sizing and autoscaling bounds
- **Autoscaling**: All clouds support automatic scaling within configured limits
- **Environment-aware**: Production vs development configurations

Run the CLI:

```bash
chiral --config config.js
```

This generates:
- `aws-assembly/` (Directory of CDK and CloudFormation Template)
- `azure-deployment.bicep` (Azure Bicep Template)
- `gcp-deployment.tf` (Google Infrastructure Manager Terraform Blueprint)

### Importing Existing IaC

If you have existing infrastructure defined in Terraform, CloudFormation, or Bicep, you can import it into a Chiral config to get started:

```bash
npx ts-node src/main.ts import -s path/to/your/infrastructure.tf -p aws -o chiral.config.ts
```

Supported formats:
- `.tf` (Terraform HCL)
- `.tfstate` (Terraform state files)
- `.yaml`/`.yml` (CloudFormation templates)
- `.json` (CloudFormation templates)
- `.bicep` (Azure Bicep templates)

The import command attempts to map existing resources to Chiral intent, generating a starting config that you can refine. See [docs/MIGRATION.md](docs/MIGRATION.md) for detailed usage and limitations.

### Requirements

- Node.js
- For AWS deployment: AWS CDK CLI (`cdk`)
- For Azure validation: Azure CLI (`az`)
- For GCP deployment: Terraform CLI (`terraform`)
- For importing Bicep: Azure CLI (`az`)

### Deployment

- For AWS authentication: AWS CLI (`aws`)
- For GCP authentication: Google Cloud CLI (`gcloud`)
- For Azure authentication: Azure CLI (`az`)

---

### How
We use the Chiral Pattern to avoid vendor lock-ins to 3rd-party state managers. We use a centralized source (Intent Schema) and the Chiral Engine to generate 1st-party distributions (Native Cloud Artifacts) targeting AWS, Azure, GCP.


---

## Name: The Chiral Pattern

**Definition:** A multi-cloud infrastructure design where an intent schema is compiled simultaneously into non-superimposable, native intermediary artifacts for each cloud platform.

### The 3 Laws of Chirality
1. **Shared DNA:** There is only one source of truth (The *ChiralSpec*).
2. **Native Cloud Separation:** AWS, Azure, and GCP outputs are generated separately.
3. **Zero State:** The Chiral Engine never stores state; it only emits artifacts.

### Description
The Chiral Pattern is a software design approach for multi-cloud infrastructure management where an intent schema is used to generate native, 1st-party artifacts for each target cloud. 

The pattern produces mirror-image outputs (for example, AWS CloudFormation via CDK and Azure Bicep / Google Infrastructure Manager Terraform Blueprint) to ensure that both deployments share the same functional intent while remaining fully compatible with their respective cloud-native constructs. The Chiral Pattern allows cloud independence, auditability, and synchronization, enabling teams to change intent without relying on 3rd-party state managers to avoid vendor lock-ins.

Its metaphorical name emphasizes that the outputs are structurally identical in purpose but inherently distinct in implementation, like left and right hands.


---

> We define our infrastructure in the **Chiral Config**. The **Chiral Engine** generates the native **Enantiomers** (for example, AWS CDK, AWS CloudFormation, Azure Bicep, Azure Resource Manager, Google Infrastructure Manager Terraform Blueprint), which are then deployed to their respective clouds.

---

## The Core Metaphor (Why it works)

**Chirality** (from Greek *kheir*, "hand") is the property of an object being non-superimposable on its mirror image.

*   **The Problem:** Your AWS EKS cluster, Azure AKS cluster, and GCP GKE cluster are mirror images. They do the exact same thing (orchestrate containers).
*   **The Reality:** They are **non-superimposable**. You cannot overlay an AWS CloudFormation onto Azure Bicep or GCP Terraform. The APIs, IAM roles, and networking constructs simply do not line up.
*   **The Solution:** You need a **Chiral Engine**—a central logic core that understands the shared DNA but generates the distinct programmatic "left-handed" (AWS) and declarative "right-handed" (Azure and/or GCP) artifacts.

---

## Chiral Design Philosophy

### Core Principles
1. **Single DNA**: Intent schema drives all outputs
2. **Native Separation**: Each cloud gets its preferred native IaC format
3. **Zero State**: No external state management or databases

### Key Concepts
- **Enantiomers**: Mirror-image outputs like left/right-handed molecules
- **Intent-Driven**: Business requirements abstracted from cloud specifics
- **Artifact Generation**: Compile intent into native cloud templates
- **No 3rd-party Lock-in**: Avoid 3rd-party state managers; use each cloud's best IaC and native state manager

### Why It Works
- **Uniform**: Same intent produces functionally identical infrastructure
- **Auditability**: Direct generation from code, no hidden state
- **Evolution**: Change intent once, update all clouds simultaneously
- **Vendor Independence**: Each cloud's native tools, not generic compromises

### Pattern Benefits
- Eliminates drift between multi-cloud deployments
- Reduces complexity of managing different IaC tools
- Enables true infrastructure portability
- Maintains each cloud's optimization and features
- Intent-driven discipline: Forces separation of business requirements from technical implementation

The philosophy embraces cloud diversity while striving for functional uniformity through intent.

For a deeper dive into **why multi-cloud infrastructure management is fundamentally challenging** and how Chiral addresses these structural difficulties, see [docs/CHALLENGES.md](docs/CHALLENGES.md).

### Native Artifacts

Chiral produces native cloud artifacts that can be deployed independently: AWS CDK and CloudFormation for AWS, Azure Bicep for Azure, and Google Infrastructure Manager Terraform Blueprint. These are standard cloud templates that work with native cloud tooling. Meanwhile, [Google Infrastructure Manager Terraform Blueprint](https://cloud.google.com/blog/products/management-tools/introducing-infrastructure-manager-powered-by-terraform), is a managed service, reducing self-management overhead.

**Autoscaling Support:**
- **AWS EKS**: Auto-scaling node groups with `minSize`/`maxSize` from intent
- **Azure AKS**: Auto-scaling agent pools with `minCount`/`maxCount` from intent  
- **GCP GKE**: Auto-scaling node pools with `min_node_count`/`max_node_count` from intent

**State Management Considerations:**
- **AWS CDK/CloudFormation**: Managed natively by AWS; no external state files required.
- **Azure Bicep/ARM**: Handled by Azure Resource Manager; built-in consistency and rollback.
- **GCP Infrastructure Manager**: Google Infrastructure Manager runs Terraform as a managed service. Users deploy via Google Infrastructure Manager Terraform Blueprint without directly handling state. The service handles state storage, locking, and policy enforcement, reducing operational and compliance overhead. Core Terraform risks, such as shared mutable state and partial apply failures, remain but are managed by Google rather than by individual teams. See [docs/CHALLENGES.md](docs/CHALLENGES.md) for details on these structural risks.

## Chiral vs Terraform State Management

Chiral eliminates the fundamental state management problems that make Terraform challenging at scale:

| **Terraform State Problem** | **Chiral Solution** |
|----------------------------|---------------------|
| **State Corruption** - Concurrent modifications, partial applies, network issues can corrupt state files requiring manual recovery | **Zero State Architecture** - No state files to corrupt. Each cloud manages its own state natively |
| **Lock Contention** - Multiple pipelines compete for state locks, causing orphaned locks and manual intervention | **Native Cloud Locking** - AWS CloudFormation, Azure ARM, and GCP Infrastructure Manager handle locking automatically |
| **Backend Management** - Complex setup and maintenance of Amazon S3, Azure Storage, Google Cloud Storage backends with encryption, versioning, and access controls | **No Backend Required** - Each cloud's native service handles state storage, versioning, and security automatically |
| **Security Risks** - State files contain sensitive data (secrets, IPs, metadata) that can leak or be exposed | **No External State Files** - Sensitive information stays within each cloud's secure control plane |
| **Multi-Account Spanning** - State files cannot securely span cloud accounts without breaking trust boundaries | **Native Cloud Security** - Each cloud's IAM and security controls manage state within their trust boundaries |
| **Cost Overhead** - Google Infrastructure Manager costs $0.99/month per resource plus operational overhead for state management | **Zero Additional Cost** - No third-party state management fees or operational overhead |

### Terraform Migration Benefits

**From Problematic Terraform Approaches:**
- **A. Local State**: Single point of failure and security risks
- **B. Remote Backend per Environment**: Backend complexity and lock contention
- **C. Coarse-Grained State**: Blast radius from state file corruption
- **D. Self-Managed Terraform**: [Manage and Secure the Underlying Network and Infrastructure](https://developer.hashicorp.com/terraform/enterprise/deploy/reference/application-security)
- **E. Managed Terraform**: [$0.99/resource/month fees](https://www.hashicorp.com/en/pricing) and [remaining state issues]()

**To Chiral's Stateless Approach:**
- Generate native artifacts from single intent
- Deploy with each cloud's optimal tools
- Zero state management overhead
- Built-in security and compliance
- True multi-cloud consistency

### Migration Path

```bash
# Import existing Terraform configurations
npx ts-node src/main.ts import -s path/to/infrastructure.tf -p aws -o chiral.config.ts

# Generate stateless native artifacts
chiral --config chiral.config.ts

# Deploy with cloud-native tools (no Terraform state required)
cd dist/aws-assembly && cdk deploy
az deployment group create --resource-group my-rg --template-file azure-deployment.bicep
gcloud infra-manager blueprints apply --gcp-deployment.tf
```

## How Chiral Compares to Traditional Multi-Cloud Tools

Chiral takes a different approach to multi-cloud infrastructure management compared to traditional IaC tools:

### Multi-Cloud Synchronization
- **Single intent change**: Modify intent once → generates AWS CDK and CloudFormation, Azure Bicep, and Google Infrastructure Manager Terraform Blueprint
- **Reduced coordination**: Reduces the need to manually keep multiple cloud templates in sync
- **Regenerate artifacts**: Change intent → regenerate all artifacts → deploy to clouds

### Infrastructure Management
- **No state files**: Traditional IaC requires managing complex state (e.g., CDK context.json)
- **No lock files**: No dealing with state locking, drift detection, or reconciliation
- **No cleanup**: Artifacts are pure functions of intent - no orphaned resources or manual cleanup

### Developer Experience
- **Intent-first coding**: Write business requirements, not cloud-specific APIs
- **Built-in validation**: Automatic syntax checking and type safety
- **Framework handles complexity**: You focus on "what", Chiral handles "how" across clouds

---

## Implementation Approaches: Programmatic vs Declarative

### Programmatic Approach (AWS CDK)
**Purpose**: The primary approach - most feature-rich, developer-friendly IaC

**Characteristics**:
- Programmatic constructs (classes, methods)
- Rich ecosystem and tooling
- Strong typing and validation
- Complex logic capabilities

**Current**: AWS CDK (most mature programmatic IaC) → CloudFormation (declarative output)

**Why AWS CDK is programmatic**: CDK is AWS's primary IaC tool, even though it generates declarative CloudFormation. This reflects AWS's ecosystem where programmatic CDK is preferred over raw CloudFormation templates.

**Ideal**: CDK-equivalent tools (TypeScript/Python-based, construct libraries)

### Declarative Approaches (Azure Bicep, GCP Terraform)
**Purpose**: Generate native declarative artifacts optimized for each cloud

**Characteristics**:
- DSL or template-based syntax
- Cloud-native validation
- Simple deployment workflows
- Direct API compatibility

**Current**:
- Azure Bicep (modern declarative DSL)
- Google Infrastructure Manager Terraform Blueprint

**Ideal**: Each cloud's best native IaC format (Bicep for Azure, Terraform for GCP)

### Selection Criteria

**For Programmatic Approach:**
- Does it have rich programmatic APIs?
- Can it generate complex infrastructure?
- Is it the most mature tool for its cloud?

**For Declarative Approaches:**
- Is it the cloud's recommended native format?
- Does it integrate best with cloud APIs?
- Is it optimized for that cloud's features?

### Design Principles

1. **Single Intent → Multiple Natives**: One config drives each cloud's best IaC
2. **No Compromises**: Use each cloud's strongest tool, not lowest common denominator
3. **Asymmetric by Design**: Programmatic vs declarative reflect different IaC philosophies, not equal capabilities
4. **Evolve Independently**: Each approach can change tools as clouds evolve

The key is maintaining the intent-driven approach while letting each cloud use its optimal IaC paradigm.

---

## Project Structure

```text
chiral-infrastructure-as-code
├── chiral.config.ts                  # [DATA] The "DNA". Single Source of Truth.
├── dist/                             # [ARTIFACTS] The "Racemic Mixture" (Output Folder).
│   ├── aws-assembly/                 # [ASSEMBLY] Native CloudFormation and Assets.
│   │   ├── AwsStack.assets.json      # Optional if your stack has no assets.
│   │   ├── AwsStack.template.json    # [NATIVE] The deployable AWS template.
│   │   ├── manifest.json             # Metadata about the assembly, stacks, and assets.
│   │   └── tree.json                 # A tree view of the stack's construct hierarchy.
│   ├── azure-deployment.bicep        # [NATIVE] The deployable Azure Bicep enantiomer.
│   └── gcp-deployment.tf             # [NATIVE] The deployable Google Infrastructure Manager Terraform Blueprint.
├── docs/                             # Documentation and Synchronization research.
│   └── ideas/
│       ├── AWS_CDK_To_Azure_Bicep_Guide.md
│       ├── Multi-Cloud_IaC_Synchronization_Challenges.md
│       └── Syncing_AWS_CDK_and_Bicep.md
├── examples/                         # [EXAMPLES] Comprehensive guides for different IaC approaches.
│   ├── basic-setup/
│   │   └── README.md
│   ├── bicep-to-chiral/
│   │   └── README.md
│   ├── cdk-to-chiral/
│   │   └── README.md
│   ├── gcp-to-chiral/
│   │   └── README.md
│   ├── tofu-to-chiral/
│   │   └── README.md
│   ├── pulumi-to-chiral/
│   │   └── README.md
│   └── terraform-to-chiral/
│       └── README.md
├── src/
│   ├── __tests__/                    # [TESTS] Unit and integration tests for adapters and synthesis.
│   │   ├── azure-adapter.test.ts
│   │   ├── gcp-adapter.test.ts
│   │   ├── hardware-map.test.ts
│   │   ├── intent.test.ts
│   │   └── synthesis-integration.test.ts
│   ├── adapters/                     # [LOGIC] Implementation approaches.
│   │   ├── programmatic/             # [PROGRAMMATIC] CDK-based imperative approach
│   │   │   └── aws-cdk.ts            # [AWS] CDK constructs and classes
│   │   └── declarative/              # [DECLARATIVE] DSL/template-based approaches
│   │       ├── azure-bicep.ts        # [AZURE] Bicep template generation
│   │       └── gcp-terraform.ts      # [GCP] Google Infrastructure Manager Terraform Blueprint generation
│   ├── intent/                       # [TYPES] Abstract business requirements.
│   │   └── index.ts                  # Defines KubernetesIntent, DatabaseIntent, etc.
│   ├── translation/                   # [TRANSLATION] Hardware mapping between clouds.
│   │   └── hardware-map.ts           # Maps abstract sizes to cloud-specific SKUs
│   └── main.ts                       # [ENGINE] Orchestrates synthesis from intent to artifacts.
├── package.json                      # Dependencies and Scripts.
├── package-lock.json                 # Lock file for exact dependency versions.
├── tsconfig.json                     # TypeScript configuration.
└── README.md                         # Project documentation and Chiral Pattern definition.
```

---

## Examples

The `examples/` directory provides practical guides for implementing the Chiral pattern:

- **`basic-setup/`**: Contains a minimal example for setting up a new Chiral project from scratch, including simple configuration and intent interfaces.
- **`bicep-to-chiral/`**: Guide for converting Azure Bicep templates to the Chiral pattern.
- **`cdk-to-chiral/`**: Guide for converting AWS CDK stacks to the Chiral pattern.
- **`gcp-to-chiral/`**: Guide for converting GCP Infrastructure Manager templates to the Chiral pattern.
- **`tofu-to-chiral/`**: Demonstrates how to convert OpenTofu projects to the Chiral pattern, extracting business intent and enabling multi-cloud generation.
- **`pulumi-to-chiral/`**: Guide for converting Pulumi programs to the Chiral pattern.
- **`terraform-to-chiral/`**: Guide for converting Terraform configurations to the Chiral pattern.

---

## Implementation Terminology

When writing your code, use these specific terms to reinforce the pattern:

*   **Intent Schema:** The abstract TypeScript interface defining what you want (e.g., `interface ChiralSystem`).
*   **Adapters:** The cloud-specific implementations that translate intent into native IaC formats.
*   **Synthesis:** The process of running the engine. You don't "deploy" directly—you **generate** artifacts, then deploy the native results.

## About the Chiral Metaphor

This project is named after the "Chiral Pattern" - a chemistry concept where molecules exist in left-handed and right-handed forms that are mirror images but cannot be superimposed. 

**However, the metaphor is imperfect when applied to concrete cloud resources.** While programmatic (CDK) and declarative (Bicep/Terraform) approaches achieve the same functional goals, they produce fundamentally different architectures:

- **CDK → CloudFormation**: AWS-native constructs that leverage AWS-specific APIs and services
- **Bicep → ARM Templates**: Azure-native resource definitions optimized for Azure Resource Manager
- **Google Infrastructure Manager Terraform Blueprint**: Provider-agnostic declarations that get translated to cloud-specific APIs

These approaches don't "superimpose" on concrete cloud resources - they produce different architectural patterns, different API calls, and different deployment lifecycles. The value lies in abstracting the **intent** (what you want) while allowing each cloud to use its optimal **implementation approach** (how to achieve it).

---

## Pipeline Summary

We define our infrastructure in the **Intent Schema**. Our **Chiral Engine** generates native artifacts using **Programmatic** (AWS CDK) and **Declarative** (Azure Bicep, GCP Terraform) approaches, which are then deployed to their respective clouds.

---

## Mermaid Diagram

```mermaid
flowchart TD
    classDef config   fill:#fffbe6,stroke:#c9a000,color:#6b4c00
    classDef engine   fill:#f3e8ff,stroke:#7c3aed,color:#4a1d96
    classDef awsNode  fill:#fff3e0,stroke:#e67e00,color:#7a3800
    classDef azNode   fill:#e3f2fd,stroke:#0063b1,color:#003a75
    classDef gcpNode  fill:#e8f5e9,stroke:#1e8a3e,color:#0d4a1f
    classDef header   fill:#e2e8f0,stroke:#94a3b8,color:#1e293b

    CONFIG[chiral.config.ts<br/>────────────────────────────────────────────────────────────<br/>Single Source of Truth<br/>Defines KubernetesIntent<br/>Defines DatabaseIntent<br/>Defines NetworkIntent<br/>────────────────────────────────────────────────────────────<br/>ChiralSpec interface]:::config

    subgraph ENGINE[Chiral Engine]
        EH[src/main.ts<br/>────────────────────────────────────────────────────────────<br/>Zero-State Orchestrator]:::header
        INTENT[Intent Schema<br/>────────────────────────────────────────────────────────────<br/>src/intent/index.ts<br/>Abstracts business needs<br/>into cloud-agnostic types]:::engine
        TRANSLATION[Translation Layer<br/>────────────────────────────────────────────────────────────<br/>src/translation/<br/>hardware-map.ts & regional-metadata.ts<br/>Translates & validates regional specs<br/>e.g. m5.xlarge to D4s_v3]:::engine
    end

    subgraph ADAPTERS[Implementation Approaches]
        AH[src/adapters/<br/>────────────────────────────────────────────────────────────<br/>Programmatic & Declarative<br/>Cloud-Specific Adapters]:::header
        AWS_A[programmatic/aws-cdk.ts<br/>────────────────────────────────────────────────────────────<br/>PROGRAMMATIC<br/>AWS CDK Constructs<br/>TypeScript classes & methods<br/>Rich ecosystem and typing]:::awsNode
        AZURE_A[declarative/azure-bicep.ts<br/>────────────────────────────────────────────────────────────<br/>DECLARATIVE<br/>Azure Bicep Template<br/>Modern DSL for Azure<br/>Direct ARM compatibility]:::azNode
        GCP_A[declarative/gcp-terraform.ts<br/>────────────────────────────────────────────────────────────<br/>DECLARATIVE<br/>Google Infrastructure Manager Terraform Blueprint<br/> Terraform's Declarative Syntax<br/>Reusable Modules]:::gcpNode
    end

    subgraph DIST[Artifacts]
        DH[dist/ - Generated Artifacts<br/>────────────────────────────────────────────────────────────<br/>Native Cloud IaC Formats]:::header
        AWS_D[aws-assembly/<br/>────────────────────────────────────────────────────────────<br/>CloudFormation Template<br/>AwsStack.template.json<br/>CDK Assets & Manifest]:::awsNode
        AZURE_D[azure-deployment.bicep<br/>────────────────────────────────────────────────────────────<br/>Azure Bicep Template<br/>Native ARM DSL<br/>Deployable Azure template]:::azNode
        GCP_D[gcp-deployment.tf<br/>────────────────────────────────────────────────────────────<br/>Google Infrastructure Manager Terraform Blueprint<br/>Terraform's Declarative Syntax<br/>Deployable Google Infrastructure Manager Terraform Blueprint]:::gcpNode
    end

    AWS_C([Amazon Web Services<br/>────────────────────────────────────────────────────────────<br/>CloudFormation<br/>EKS - Elastic Kubernetes]):::awsNode
    AZURE_C([Microsoft Azure<br/>────────────────────────────────────────────────────────────<br/>ARM - Azure Resource Mgr<br/>AKS - Azure Kubernetes]):::azNode
    GCP_C([Google Cloud Platform<br/>────────────────────────────────────────────────────────────<br/>Infrastructure Manager<br/>GKE - Google Kubernetes]):::gcpNode

    CONFIG --> ENGINE
    EH --> INTENT
    EH --> TRANSLATION
    INTENT --> AWS_A
    INTENT --> AZURE_A
    INTENT --> GCP_A
    TRANSLATION --> AWS_A
    TRANSLATION --> AZURE_A
    TRANSLATION --> GCP_A
    AWS_A --> AWS_D
    AZURE_A --> AZURE_D
    GCP_A --> GCP_D
    AWS_D --> AWS_C
    AZURE_D --> AZURE_C
    GCP_D --> GCP_C
```

---

## Project Structure

```text
chiral-infrastructure-as-code
├── chiral.config.ts                  # [DATA] The "DNA". Single Source of Truth.
├── dist/                             # [ARTIFACTS] The "Racemic Mixture" (Output Folder).
│   ├── chiral.config.js
│   ├── examples/
│   │   └── cdk-to-chiral/
│   │       ├── app.js
│   │       └── cdk-stack.js
│   └── src/
│       ├── __tests__/
│       │   ├── azure-adapter.test.js
│       │   ├── gcp-adapter.test.js
│       │   ├── hardware-map.test.js
│       │   ├── intent.test.js
│       │   └── synthesis-integration.test.js
│       ├── adapters/                 # [LOGIC] Implementation approaches.
│       │   ├── aws-left.js
│       │   ├── azure-right.js
│       │   ├── declarative/
│       │   │   ├── azure-bicep.js
│       │   │   └── gcp-terraform.js
│       │   ├── gcp-right.js
│       │   └── programmatic/
│       │       └── aws-cdk.js
│       ├── intent/
│       │   └── index.js
│       ├── main.js
│       ├── rosetta/
│       │   └── hardware-map.js
│       └── translation/
│           ├── hardware-map.js
│           ├── import-map.js
│           └── regional-metadata.js
├── docs/                             # Documentation and Synchronization research.
│   ├── CHALLENGES.md
│   ├── MIGRATION.md
│   └── ideas/
│       ├── AWS_CDK_To_Azure_Bicep_Guide.md
│       ├── Multi-Cloud_IaC_Synchronization_Challenges.md
│       └── Syncing_AWS_CDK_and_Bicep.md
├── examples/                         # [EXAMPLES] Comprehensive guides for different IaC approaches.
│   ├── README.md
│   ├── azure-migration-example/
│   │   └── chiral.config.ts
│   ├── basic-setup/
│   │   └── README.md
│   ├── bicep-to-chiral/
│   │   └── README.md
│   ├── cdk-to-chiral/
│   │   ├── README.md
│   │   ├── app.ts
│   │   ├── cdk-stack.ts
│   │   └── cdk.json
│   ├── gcp-terraform-deployment.sh
│   ├── gcp-to-chiral/
│   │   ├── README.md
│   │   └── comparison.md
│   ├── greenfield-development-example/
│   │   └── chiral.config.ts
│   ├── multi-cloud-migration-example/
│   │   └── chiral.config.ts
│   ├── pulumi-to-chiral/
│   │   └── README.md
│   ├── state-corruption-scenario/
│   │   └── README.md
│   ├── terraform-to-chiral/
│   │   └── README.md
│   └── tofu-to-chiral/
│       └── README.md
├── jest.config.js
├── jest.setup.js
├── LICENSE
├── package.json                      # Dependencies and Scripts.
├── package-lock.json                 # Lock file for exact dependency versions.
├── src/
│   ├── __tests__/                    # [TESTS] Unit and integration tests for adapters and synthesis.
│   │   ├── azure-adapter.test.ts
│   │   ├── gcp-adapter.test.ts
│   │   ├── generation-integration.test.ts
│   │   ├── hardware-map.test.ts
│   │   ├── import.test.ts
│   │   ├── intent.test.ts
│   │   └── migration.test.ts
│   ├── adapters/                     # [LOGIC] Implementation approaches.
│   │   ├── declarative/              # [DECLARATIVE] DSL/template-based approaches
│   │   │   ├── azure-bicep.ts        # [AZURE] Bicep template generation
│   │   │   └── gcp-terraform.ts      # [GCP] Google Infrastructure Manager Terraform Blueprint generation
│   │   └── programmatic/             # [PROGRAMMATIC] CDK-based imperative approach
│   │       └── aws-cdk.ts            # [AWS] CDK constructs and classes
│   ├── intent/                       # [TYPES] Abstract business requirements.
│   │   └── index.ts                  # Defines KubernetesIntent, DatabaseIntent, etc.
│   ├── main.ts                       # [ENGINE] Orchestrates synthesis from intent to artifacts.
│   ├── translation/                   # [TRANSLATION] Hardware mapping between clouds.
│   │   ├── hardware-map.ts           # Maps abstract sizes to cloud-specific SKUs
│   │   ├── import-map.ts
│   │   └── regional-metadata.ts
│   └── validation.ts
├── tsconfig.json                     # TypeScript configuration.
└── README.md                         # Project documentation and Chiral Pattern definition.
```

---

## Open-source software

https://github.com/lloydchang/chiral-infrastructure-as-code

---

## License

[GNU Affero General Public License v3.0 or later](https://github.com/lloydchang/chiral-infrastructure-as-code/blob/main/LICENSE)
