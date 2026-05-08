# Workflow Dream

The long-term dream is a debuggable AI workflow system built from ordinary
tools.

## Tool Loop

```text
install CLI into sandbox
  -> run `tool --help`
  -> AI learns capabilities
  -> user and AI compose commands in a REPL loop
  -> transcript becomes a prototype
  -> prototype becomes a repeatable workflow
  -> workflow is published to a backend
  -> Trello-like UI remains the human control plane
```

## Why CLI Tools

A CLI is already a public tool protocol:

- installable
- discoverable
- composable
- sandboxable
- loggable
- language-agnostic
- versionable
- scriptable
- human-operable
- AI-operable

This avoids inventing a new plugin acronym. Tool authors can publish ordinary
CLIs. An AI agent can discover and operate them.

## Trello-Like Surface

A card can hold:

- inputs
- attachments
- extracted facts
- proposed commands
- command history
- outputs
- approvals
- retries
- final artifacts

The card is the visible workflow state. The sandbox is the execution surface.
The AI is the operator.

## Origin Story

One motivating real workflow was processing mail for many personal-injury
cases, where each piece of mail could require an update to one of hundreds of
tracked cases.

The desired system would help classify, extract, match, propose updates, run
tools, and preserve history without turning the process into an opaque prompt.
