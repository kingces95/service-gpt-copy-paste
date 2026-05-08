# Workflow Cards

## Original Idea

Trello represents work as visible cards moving through lists.

Original style:

```text
Inbox -> Ready -> Running -> Needs Review -> Done
```

A card can hold:

- title
- description
- comments
- attachments
- checklist
- history
- assignee/state

## Local Translation

The project imagines Trello or a Trello-like UI as the human control plane for
AI-operated workflows.

Example shape:

```text
card
  inputs
  extracted facts
  proposed commands
  approvals
  stdout/stderr
  artifacts
  retry history
```

## Why It Matters

This gives end users visible preparation, execution, and history. AI can operate
tools, but the work item remains inspectable and auditable.
