project-root:
  src:
    abstract:
      - Operation.js              # Base Operation abstraction
    backend:
      - BackendOperation.js       # Manages state, streams, and synchronization
      - State.js                  # Defines structured states
      - index.js                  # Barrel file for orchestrator
    operations:
      - PollingOperation.js       # Workflow to poll the clipboard
      - ProcessingOperation.js    # Workflow to write to the clipboard
      - index.js                  # Barrel file for operations
    commands:
      - Command.js                # Derivation for script-based operations (byte streams)
      - SpawnCommand.js           # Concrete class for spawn
      - WebRequestCommand.js      # Concrete class for axios/web requests
      - index.js                  # Barrel file to export Command-related classes
    frontend:
      - Frontend.js               # Base UI class for rendering
      - CliCommand.js                    # CLI implementation
      - WebTrayUI.js              # Web tray implementation
      - copy.js                   # Contains static or injected copy text
      - index.js                  # Barrel file for UI components
  - package.json
  - .gitignore
  - README.md
