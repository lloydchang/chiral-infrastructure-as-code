# Core Isolation Enforcement

Chiral enforces permanent architectural separation between the core infrastructure engine and outer layer features (AI agents, skills, etc.) to maintain reliability and focus.

## Core Principles

### Permanent Separation
- **Core Focus**: Exclusively the three pillars (K8s, Postgres, ADFS)
- **Zero Dependencies**: Core never imports from agent/, skills/, or AI modules
- **Fallback Architecture**: Outer layers are optional and must fallback to core
- **Compilation Enforcement**: Architectural violations cause build failures

## Enforcement Mechanisms

### Pre-build Checks
The `enforce-core-isolation` script runs before every build and test:

```bash
npm run enforce-core-isolation
```

This validates:
- No forbidden imports in core modules
- Three pillars focus maintained
- Agent dependencies properly isolated

### Core Modules
Core consists of minimal, focused modules:
- `src/intent/` - Intent schema definitions
- `src/validation/` - Configuration and compliance validation
- `src/main.ts` - Core CLI (three pillars only)
- `src/adapters/programmatic/` - Programmatic adapters
- `src/adapters/declarative/` - Declarative adapters

### Outer Layer Modules
Optional features isolated in separate directories:
- `src/agents/` - AI agent implementations
- `src/skills/` - Agent skill definitions
- Any AI/ML integrations

## Benefits

### Reliability
- Core functionality works without AI services
- Fallback to deterministic generation
- No external API dependencies in core

### Maintainability
- Clear separation of concerns
- Independent evolution of core and agents
- Simplified testing and validation

### Security
- Core has minimal attack surface
- Sensitive operations isolated
- No AI service credentials required for core

## Fallback Behavior

When outer layer services are unavailable:
- Multi-agent generation falls back to single-agent
- Agentic import falls back to deterministic mapping
- All core features remain fully functional

## Implementation

Core isolation is enforced through:
- Import analysis in build scripts
- TypeScript path restrictions
- Automated dependency checking
- Compilation failures for violations

## Related Documentation

- [Agent Skills](./skills.md) - Optional outer layer features
- [Multi-Agent Generation](./MULTI_AGENT_GENERATION.md) - AI-enhanced capabilities
