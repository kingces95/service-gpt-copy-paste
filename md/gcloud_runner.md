
# Node.js Class for Executing GCloud Commands

This document describes a Node.js class that executes a `gcloud` command from a `.gc` file, substituting environment variables, with support for streaming I/O.

---

## **1. Class Implementation**

Save the following as `GCloudCommand.js`:

```javascript
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class GCloudCommand {
  /**
   * Initialize with the path to the .gc file.
   * @param {string} filePath - Path to the .gc file containing the gcloud command.
   */
  constructor(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.filePath = path.resolve(filePath);
    this.command = fs.readFileSync(this.filePath, "utf-8").trim();

    if (!this.command) {
      throw new Error(`The .gc file is empty: ${filePath}`);
    }
  }

  /**
   * Execute the command with substituted environment variables.
   * @param {Object} env - An object containing key-value pairs for environment variables.
   * @returns {Promise<void>} - Resolves when the command completes successfully.
   */
  execute(env = {}) {
    return new Promise((resolve, reject) => {
      // Substitute variables in the command
      let substitutedCommand = this.command;
      for (const [key, value] of Object.entries(env)) {
        substitutedCommand = substitutedCommand.replace(new RegExp(`\$${key}`, "g"), value);
      }

      // Split the command into parts for spawn
      const [command, ...args] = substitutedCommand.split(/\s+/);

      // Spawn the process
      const child = spawn(command, args, { stdio: "inherit", shell: true });

      child.on("error", (err) => {
        console.error(`Failed to start process: ${err.message}`);
        reject(err);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });
    });
  }
}

module.exports = GCloudCommand;
```

---

## **2. Usage Example**

### **a. Create a `.gc` File**
Save a `.gc` file (e.g., `deploy.gc`) with a `gcloud` command containing environment variables:

```plaintext
gcloud workflows deploy $WORKFLOW_NAME --location=$LOCATION --source=$SOURCE_PATH
```

### **b. Run the Node.js Script**

Create a script, `run.js`, to use the `GCloudCommand` class:

```javascript
const GCloudCommand = require("./GCloudCommand");

(async () => {
  try {
    // Initialize the GCloudCommand with the .gc file
    const command = new GCloudCommand("deploy.gc");

    // Execute the command with environment variable substitution
    await command.execute({
      WORKFLOW_NAME: "secure-enumerate-boards",
      LOCATION: "us-central1",
      SOURCE_PATH: "outputs/expanded_workflow.yaml",
    });

    console.log("Command executed successfully.");
  } catch (err) {
    console.error(`Error executing command: ${err.message}`);
  }
})();
```

---

## **3. Run the Script**

Execute the script in your terminal:
```bash
node run.js
```

---

## **4. Features of This Implementation**

1. **Environment Variable Substitution**:
   - Supports `$VARIABLE_NAME` syntax.
   - Substitutes variables from the provided object (`env`).

2. **Platform Independence**:
   - Uses `spawn` with `shell: true` to ensure compatibility with Windows, Linux, and macOS.

3. **Streaming I/O**:
   - Uses `stdio: "inherit"` to directly stream output and error logs from the command to the terminal.

4. **Reproducibility**:
   - The `.gc` file contains a pure `gcloud` command, making it easy to debug or run manually.

5. **Error Handling**:
   - Throws errors for missing `.gc` files, empty commands, or non-zero exit codes.

---

## **5. Summary**

This class provides a flexible and reusable way to execute `gcloud` commands from `.gc` files, with support for environment variable substitution and platform-independent shell execution.
