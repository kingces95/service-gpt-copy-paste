# North Star

AI is too fire-and-forget. It needs a debuggable pipeline.

This project explores AI-assisted work as a visible, composable workflow rather
than an opaque prompt-response exchange. The goal is for an AI agent to operate
inside a transparent pipeline where each step can be prepared, executed,
inspected, retried, documented, and audited.

The foundation is deliberately ordinary:

- command-line tools
- Unix-style process boundaries
- structured stdin/stdout/stderr
- runtime metadata
- sandboxed execution
- durable workflow state
- human-readable history

Local enough to compose.
Remote enough to automate.
Simple enough to inspect.
Neutral enough for communities.

The intended workflow is:

1. Install or expose tools in an isolated environment.
2. Discover capabilities with `--help`.
3. Compose commands interactively in an AI-operated REPL loop.
4. Capture command history, outputs, and decisions.
5. Promote a working transcript into a repeatable workflow.
6. Publish stable workflows to a backend service.
7. Keep a human-facing control plane such as Trello for preparation, approval,
   execution, and history.

The project is rooted in the belief that useful AI automation needs visible
state and inspectable steps. A workflow should not vanish into a single model
call. It should leave behind a trail that a person can understand and replay.
