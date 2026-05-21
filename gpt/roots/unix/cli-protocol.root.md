# CLI Protocol

## Original Idea

Unix tools compose through a small protocol:

```bash
cat input.txt | grep foo | sort > output.txt
echo $?
```

Core pieces:

- argv
- stdin
- stdout
- stderr
- exit code
- environment
- cwd
- signals

## Local Translation

The project treats ordinary CLIs as the neutral plugin boundary for AI tools.

Example style:

```bash
trello card list --board cases --json
trello card comment add --id 123 --message "Updated from mail"
```

An AI can discover a tool with:

```bash
trello --help
trello card --help
```

## Why It Matters

No bespoke agent plugin SDK is required. Tool authors can publish ordinary CLIs.
Humans, scripts, and AI agents can all operate the same interface.
