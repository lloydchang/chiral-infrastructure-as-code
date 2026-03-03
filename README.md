# Chiral Infrastructure as Code

> **Generate mirrored, native cloud templates from a single source of truth. Multi-cloud infrastructure in sync across AWS, Azure, GCP.**

---

### Elevator Pitch
We use the **Chiral Pattern** to avoid Infrastructure as Code (IaC) lock-in. Instead of relying on 3rd-party state managers, we maintain a central **Nucleus (Intent)** and use the **Chiral Engine** to synthesize first-party **Enantiomers (Native Templates)** for multiple clouds. This ensures native support without 3rd-party vendor lock-in.


---

## Name: The Chiral Pattern

**Definition:** A multi-cloud infrastructure design where a single, cloud-agnostic intent schema is compiled simultaneously into non-superimposable, native intermediary artifacts for each cloud platform.

### The 3 Laws of Chirality
1. **Single DNA:** There is only one source of truth (The *ChiralSpec*).
2. **Native Separation:** AWS, Azure, and GCP outputs are generated independently and never mixed.
3. **Zero State:** The Chiral Engine never stores state; it only emits artifacts.

### Description
The Chiral Pattern is a software design approach for multi-cloud infrastructure management where a single source of truth (the Intent Schema) is used to generate native, first-party artifacts for each target cloud. 

The pattern produces mirror-image outputs—for example, AWS CloudFormation via CDK and Azure Bicep—ensuring that both deployments share the same functional intent while remaining fully compatible with their respective cloud-native constructs. The Chiral Pattern guarantees vendor independence, auditability, and deterministic synchronization, allowing teams to evolve infrastructure declaratively without relying on third-party engines, managed state files, or cloud-agnostic compilers. 

Its metaphorical name emphasizes that the outputs are structurally identical in purpose but inherently distinct in implementation, like left and right hands.


---

> We define our infrastructure in the **Chiral Config**. Our **Chiral Engine** synthesizes the native **Enantiomers** (CloudFormation and Bicep), which are then deployed to their respective clouds.

---

## The Core Metaphor (Why it works)

**Chirality** (from Greek *kheir*, "hand") is the property of an object being non-superimposable on its mirror image.

*   **The Problem:** Your AWS EKS cluster, Azure AKS cluster, and GCP GKE cluster are mirror images. They do the exact same thing (orchestrate containers).
*   **The Reality:** They are **non-superimposable**. You cannot overlay an AWS CloudFormation template onto Azure Bicep or GCP Terraform. The APIs, IAM roles, and networking constructs simply do not line up.
*   **The Solution:** You need a **Chiral Engine**—a central logic core that understands the shared DNA but synthesizes the distinct "programmatic left-handed" (AWS), "declarative right-handed" (Azure), and "declarative right-handed" (GCP) artifacts.

---

## Chiral Design Philosophy

### Core Principles
1. **Single DNA**: One cloud-agnostic intent schema drives all outputs
2. **Native Separation**: Each cloud gets its preferred native IaC format
3. **Zero State**: No external state management or databases

### Key Concepts
- **Enantiomers**: Mirror-image outputs like left/right-handed molecules
- **Intent-Driven**: Business requirements abstracted from cloud specifics
- **Artifact Generation**: Compile intent into native cloud templates
- **No Lock-in**: Avoid third-party tools; use each cloud's best IaC

### Why It Works
- **Consistency**: Same intent produces functionally identical infrastructure
- **Auditability**: Direct generation from code, no hidden state
- **Evolution**: Change intent once, update all clouds simultaneously
- **Vendor Independence**: Each cloud's native tools, not generic compromises

### Pattern Benefits
- Eliminates drift between multi-cloud deployments
- Reduces complexity of managing different IaC tools
- Enables true infrastructure portability
- Maintains each cloud's optimization and features
- **Intent-driven discipline**: Forces separation of business requirements from technical implementation

The philosophy embraces cloud diversity while enforcing consistency through unified intent.

### Native Artifacts

Chiral produces native cloud artifacts that can be deployed independently: AWS CDK and CloudFormation for AWS, Azure Bicep for Azure, and GCP Infrastructure Manager (Terraform HCL) for GCP. These are standard cloud templates that work with native cloud tooling.

## How Chiral Compares to Traditional Multi-Cloud Tools

Chiral takes a different approach to multi-cloud infrastructure management compared to traditional IaC tools:

### Multi-Cloud Synchronization
- **Single intent change**: Modify intent once → generates AWS CDK and CloudFormation, Azure Bicep, and GCP Infrastructure Manager (Terraform HCL)
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

## Chiral Left vs Right: Design Guidelines

### Left Side (Primary/Programmatic)
**Purpose**: The "entry point" - most feature-rich, developer-friendly IaC

**Characteristics**:
- Programmatic constructs (classes, methods)
- Rich ecosystem and tooling
- Strong typing and validation
- Complex logic capabilities

**Current**: AWS CDK (most mature programmatic IaC) → CloudFormation (declarative output)
**Why AWS is programmatic**: CDK is AWS's primary IaC tool, even though it generates declarative CloudFormation. This reflects AWS's ecosystem where programmatic CDK is preferred over raw CloudFormation templates.
**Ideal**: CDK-equivalent tools (TypeScript/Python-based, construct libraries)

### Right Side (Secondary/Declarative)
**Purpose**: The "mirror" - generates native declarative artifacts

**Characteristics**:
- DSL or template-based syntax
- Cloud-native validation
- Simple deployment workflows
- Direct API compatibility

**Current**: Azure Bicep (modern declarative DSL)
**Ideal**: Each cloud's best native IaC (Bicep for Azure, Infrastructure Manager for GCP)

### Selection Criteria

**For Left:**
- Does it have rich programmatic APIs?
- Can it generate complex infrastructure?
- Is it the most mature tool for its cloud?

**For Right:**
- Is it the cloud's recommended native format?
- Does it integrate best with cloud APIs?
- Is it optimized for that cloud's features?

### Philosophy-Driven Rules

1. **Single Intent → Multiple Natives**: One config drives each cloud's best IaC
2. **No Compromises**: Use each cloud's strongest tool, not lowest common denominator
3. **Asymmetric by Design**: Left/right reflect different IaC philosophies, not equal capabilities
4. **Evolve Independently**: Each side can change tools as clouds evolve

The key is maintaining the intent-driven approach while letting each cloud use its optimal IaC paradigm.

---

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
│   └── gcp-deployment.tf             # [NATIVE] The deployable GCP Infrastructure Manager (Terraform HCL).
├── docs/                             # Documentation and Synchronization research.
│   └── ideas/
│       ├── AWS_CDK_To_Azure_Bicep_Guide.txt
│       ├── Multi-Cloud_IaC_Synchronization_Challenges.txt
│       └── Syncing_AWS_CDK_and_Bicep.txt
├── examples/                         # [EXAMPLES] Comprehensive guides for different IaC approaches.
│   ├── basic-setup/
│   │   └── README.md
│   ├── bicep-to-chiral/
│   │   └── README.md
│   ├── cdk-to-chiral/
│   │   └── README.md
│   ├── gcp-to-chiral/
│   │   └── README.md
│   ├── opentofu-to-chiral/
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
│   ├── adapters/                     # [LOGIC] The "Enantiomers".
│   │   ├── aws-left.ts               # [AWS] Left Hand. Implements CDK L3 Constructs.
│   │   ├── azure-right.ts            # [AZURE] Right Hand. Implements Bicep Template.
│   │   └── gcp-right.ts              # [GCP] Right Hand. Implements Infrastructure Manager (Terraform HCL).
│   ├── intent/                       # [TYPES] The "Schema". Abstract business needs.
│   │   └── index.ts                  # Defines KubernetesIntent, DatabaseIntent, etc.
│   ├── rosetta/                      # [TRANSLATION] The "Dictionary". 
│   │   └── hardware-map.ts           # Resolves hardware differences (e.g., m5.xlarge vs D4s_v3).
│   └── main.ts                       # [ENGINE] The "Chiral Engine". 
│                                     # Orchestrates the build. Synthesizes adapters into 'dist/'.
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
- **`opentofu-to-chiral/`**: Demonstrates how to convert OpenTofu projects to the Chiral pattern, extracting business intent and enabling multi-cloud generation.
- **`pulumi-to-chiral/`**: Guide for converting Pulumi programs to the Chiral pattern.
- **`terraform-to-chiral/`**: Guide for converting Terraform configurations to the Chiral pattern.

---

## Implementation Terminology

When writing your code, use these specific terms to reinforce the pattern:

*   **Chiral Spec:** The abstract TypeScript interface defining what you want (e.g., `interface ChiralCluster`).
*   **Enantiomers:** The specific cloud implementations. The AWS Stack and the Azure Bicep file are enantiomers of each other (mirror twins).
*   **Synthesis:** The process of running the engine. You don't "deploy" directly—you **synthesize** artifacts, then deploy the native results.

---

## Pipeline Summary

We define our infrastructure in the **Chiral Config**. Our **Chiral Engine** synthesizes the native **Enantiomers** (CloudFormation and Bicep), which are then deployed to their respective clouds.

---

## License

AGPL-3.0
