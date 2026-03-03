# Chiral Infrastructure-as-Code

> **Generate mirrored, native cloud templates from a single source of truth. AWS and Azure in sync, without third-party vendor lock-in.**

---

### Elevator Pitch
We use the **Chiral Pattern** to avoid Infrastructure as Code (IaC) lock-in. Instead of relying on 3rd-party state managers, we maintain a central **Nucleus (Intent)** and use the **Chiral Engine** to synthesize first-party **Enantiomers (Native Templates)** for both AWS and Azure. This ensures native support and zero vendor dependency.

---

## Name: The Chiral Pattern

**Definition:** A multi-cloud infrastructure design where a single, cloud-agnostic intent schema is compiled simultaneously into non-superimposable, native intermediary artifacts (CloudFormation & Bicep).

### The 3 Laws of Chirality
1. **Single DNA:** There is only one source of truth (The *ChiralSpec*).
2. **Native Separation:** AWS and Azure outputs are generated independently and never mixed.
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

*   **The Problem:** Your AWS EKS cluster and Azure AKS cluster are mirror images. They do the exact same thing (orchestrate containers).
*   **The Reality:** They are **non-superimposable**. You cannot overlay an AWS CloudFormation template onto Azure. The APIs, IAM roles, and networking constructs simply do not line up.
*   **The Solution:** You need a **Chiral Engine**—a central logic core that understands the shared DNA but synthesizes the distinct "left-handed" (AWS) and "right-handed" (Azure) artifacts.

---

## The Repository Structure

```text
chiral-infrastructure-as-code
├── chiral.config.ts                  # [DATA] The "DNA". Single Source of Truth.
├── dist/                             # [ARTIFACTS] The "Racemic Mixture" (Output Folder).
│   ├── aws-assembly/                 # [ASSEMBLY] Native CloudFormation and Assets.
│   │   ├── AwsStack.assets.json      # Optional if your stack has no assets.
│   │   ├── AwsStack.template.json    # [NATIVE] The deployable AWS template.
│   │   ├── manifest.json             # Metadata about the assembly, stacks, and assets.
│   │   └── tree.json                 # A tree view of the stack's construct hierarchy.
│   └── azure-deployment.bicep        # [NATIVE] The deployable Azure Bicep enantiomer.
├── docs/                             # Documentation and Synchronization research.
│   └── ideas/
│       ├── AWS_CDK_To_Azure_Bicep_Guide.md
│       ├── Multi-Cloud_IaC_Synchronization_Challenges.md
│       └── Syncing_AWS_CDK_and_Bicep.md
├── src/
│   ├── intent/                       # [TYPES] The "Schema". Abstract business needs.
│   │   └── index.ts                  # Defines KubernetesIntent, DatabaseIntent, etc.
│   ├── rosetta/                      # [TRANSLATION] The "Dictionary". 
│   │      └── hardware-map.ts        # Resolves hardware differences (e.g., m5.xlarge vs D4s_v3).
│   ├── adapters/                     # [LOGIC] The "Enantiomers".
│   │   ├── aws-left.ts               # [AWS] Left Hand. Implements CDK L3 Constructs.
│   │   └── azure-right.ts            # [AZURE] Right Hand. Implements Bicep Template.
│   └── main.ts                       # [ENGINE] The "Chiral Engine". 
│                                     # Orchestrates the build. Synthesizes adapters into 'dist/'.
├── package.json                      # Dependencies and Scripts.
├── tsconfig.json                     # TypeScript configuration.
└── README.md                         # Project documentation and Chiral Pattern definition.
```

---

## Implementation Terminology

When writing your code, use these specific terms to reinforce the pattern:

*   **Chiral Spec:** The abstract TypeScript interface defining what you want (e.g., `interface ChiralCluster`).
*   **Enantiomers:** The specific cloud implementations. The AWS Stack and the Azure Bicep file are enantiomers of each other (mirror twins).
*   **Synthesis:** The process of running the engine. You don't "deploy" directly—you **synthesize** artifacts, then deploy the native results.

---

## Pipeline Summary

We define our infrastructure in the **Chiral Config**. Our **Chiral Engine** synthesizes the native **Enantiomers** (CloudFormation and Bicep), which are then deployed to their respective clouds.
