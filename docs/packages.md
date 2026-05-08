# Package Map

This document summarizes the major package families and their roles.

## partial-*

The `partial-*` packages are the runtime generic-programming substrate.

- `partial-symbols`: shared symbols such as `Defines`, `Abstracts`,
  `Extends`, `Implements`, `Preconditions`, and `Compile`.
- `partial-type`: base `PartialType` and descriptor compilation hook.
- `partial-attachments`: transparent descriptor bags.
- `partial-class`: composable implementation parts.
- `partial-concept`: certified runtime concepts with `instanceof` support.
- `partial-shape`: looser observational duck typing for external JS values.
- `partial-reflect` / `partial-reflector`: meta-prototype reflection and
  descriptor copying.
- `partial-metadata`: static metadata and pre/postcondition collection.
- `partial-proxy`: method/accessor thunking for runtime conditions.
- `partial-define`, `partial-extend`, `partial-implement`: user-facing verbs.

## cursor-*

The `cursor-*` packages translate STL ideas into JavaScript.

- `cursor`: cursor/range concepts and primitive cursor/range classes.
- `cursor-algorithm`: free algorithms such as `copy`, `copyBackward`,
  `distance`, and `advance`.
- `cursor-container`: concrete containers such as list, chain, deque, vector,
  maps, sets, and container capability parts.
- `cursor-view`: lazy range/view implementations.
- `cursor-adapter`: ergonomic view factories and adapters.
- `cursor-checks`: reflectable checks for cursor/container-oriented function
  contracts.

The intended model is:

```text
concepts define capability
algorithms consume capability
containers provide storage
views provide projection
adapters provide ergonomics
checks document and validate helper requirements
```

## cli-*

The `cli-*` packages are the command, shell, runtime, and Unix interop layer.

Core command metadata:

- `cli`
- `cli-command`
- `cli-metadata`
- `cli-info`
- `cli-loader`
- `cli-yargs`
- `cli-yargs-to-pojo`
- `cli-metadata-to-pojo`
- `cli-info-to-pojo`

Runtime and services:

- `cli-runtime`
- `cli-runtime-activator`
- `cli-runtime-container`
- `cli-runtime-event-hub`
- `cli-runtime-exit-code`
- `cli-service`
- `cli-output-service`
- `cli-std-stream`

Shell and Unix-like interop:

- `cli-shell`
- `cli-subshell`
- `cli-stdio-loader`
- `cli-reader`
- `cli-writer`
- `cli-readable`
- `cli-writable`
- `cli-duplex`
- `cli-resource`
- `cli-process`
- `cli-parser`
- `cli-field-type`
- `cli-record-info`

Support packages:

- `cli-test`
- `cli-spy`
- `cli-simulator`
- `cli-console`
- `cli-http`
- `cli-rx`
- `cli-rx-poller`
- `cli-daemon`

## function-contract

`function-contract` is a small experiment for standalone function metadata:

- `Check`
- `Preconditions`
- `contract(fn)`
- `runCheck`
- `runPreconditions`

It lets functions declare argument checks using arrays and types, while leaving
room for richer reflectable checks and XSD-style restrictions later.
