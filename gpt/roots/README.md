# Roots

This directory tracks the mature systems being translated into this project.

The project prefers ideas that are interesting but not necessarily original.
The goal is often to copy the useful pressure of a proven system and translate
it into JavaScript, runtime metadata, CLIs, and AI-operated workflows.

## Layout

Each root should have its own subdirectory, such as:

- `stl/`
- `csharp/`
- `bash/`
- `unix/`
- `xsd/`
- `azure-cli/`
- `trello/`

Inside each root directory, prefer one file per source-system feature being
translated. Name the file after the familiar source feature, not after the local
implementation. For example, use `requires-expressions.md`, not
`function-preconditions.md`.

Each concept note should include:

- the original idea in the source system
- a small example in the original style
- the local JavaScript/project translation
- notes about why the mapping matters

The goal is that someone who knows the source system can scan the file list and
see familiar ideas before opening the translation notes.

This layout is preferred over one large root summary because it lets future
assistants add precise translation notes as new analogies emerge.
