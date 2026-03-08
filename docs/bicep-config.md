# Bicep Configuration for Chiral

To maintain high standards across Chiral infrastructure artifacts, implement a `bicepconfig.json` at the project root. This treats infrastructure-as-code with the same rigor as application code by enforcing best practices through the Bicep linter.

## Recommended bicepconfig.json

Place this file in your project root. It categorizes rules into Errors (blocking build failures) and Warnings (advisory).

```json
{
  "analyzers": {
    "core": {
      "verbose": false,
      "enabled": true,
      "rules": {
        "adminusername-should-not-be-literal": { "level": "error" },
        "no-hardcoded-env-urls": { "level": "error" },
        "no-unused-params": { "level": "warning" },
        "no-unused-vars": { "level": "warning" },
        "outputs-should-not-contain-secrets": { "level": "error" },
        "prefer-interpolation": { "level": "warning" },
        "secure-parameter-default": { "level": "error" },
        "use-recent-api-versions": { 
          "level": "warning",
          "maxAllowedAgeInDays": 730
        }
      }
    }
  }
}
```

## Why This Configuration Works for Chiral

- **Fail-Fast Security**: Setting `adminusername-should-not-be-literal` and `outputs-should-not-contain-secrets` to error prevents common security misconfigurations from leaving the dev machine.
- **Environment Agnostic**: The `no-hardcoded-env-urls` rule is crucial for multi-cloud Chiral pattern, ensuring use of `environment()` function for portability across Azure clouds.
- **Clean Codebase**: Flagging unused parameters and variables ensures Chiral translation layer isn't generating "dead" code leading to maintenance confusion.

## Pro-Tips for CI/CD Integration

- **Hierarchical Resolution**: For unique rules in specific Chiral projects, place different `bicepconfig.json` in subdirectories. Bicep uses the one closest to your `.bicep` file.
- **Enforce via CLI**: In CI/CD pipeline, trigger linter explicitly with:
  ```bash
  az bicep build --file main.bicep
  ```
  If configuration sets a rule to error, command returns non-zero exit code, stopping pipeline if artifact is non-compliant.

## Automation Script

To generate `bicepconfig.json` dynamically in CI/CD pipeline, store "Master Configuration" in repository and copy/inject into build directory before linter runs.

### Node.js Automation Script (scripts/setup-bicep.js)

```javascript
const fs = require('fs');
const path = require('path');

const config = {
  analyzers: {
    core: {
      enabled: true,
      rules: {
        "adminusername-should-not-be-literal": { "level": "error" },
        "no-hardcoded-env-urls": { "level": "error" },
        "no-unused-params": { "level": "warning" },
        "secure-parameter-default": { "level": "error" }
      }
    }
  }
};

// Target: Where Chiral-generated Bicep artifacts live
const targetDir = path.join(__dirname, '../dist/azure');

if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(
    path.join(targetDir, 'bicepconfig.json'),  
    JSON.stringify(config, null, 2)
);

console.log("Successfully injected bicepconfig.json into artifact directory.");
```

### Integrating into GitHub Actions

Include this step in workflow after Chiral generates artifacts but before `az bicep build`:

```yaml
- name: Inject Bicep Config
  run: node scripts/setup-bicep.js

- name: Lint and Build Bicep
  run: |
    cd dist/azure
    az bicep build --file main.bicep
```

## Why This is Better for Chiral

- **Single Source of Truth**: Manage one `setup-bicep.js` file (or base JSON template) in Chiral core repo. Rule changes propagate to every generated Bicep file in next CI/CD run.
- **Version Pinning**: Add logic to inject environment-specific configurations (stricter for Production, looser for Dev) based on build environment variables.
- **Consistency**: Forcing file into `dist/azure` directory during every build removes human error—no one can "forget" to include config file in new projects.

This setup ensures Chiral generates compliant, high-quality infrastructure.
