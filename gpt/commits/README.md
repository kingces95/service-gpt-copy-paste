# Commit Notes

This directory holds rendered design notes for commits whose message wants more
than plain text can comfortably provide on GitHub.

Use these notes when a commit captures an architectural turn, a naming grammar,
or a useful before/after example. Commit messages can then stay short while
linking to a Markdown file that renders headings, lists, and highlighted code.

Prefer filenames of the form:

```txt
YYYY-MM-DD-short-topic.md
```

Avoid using the commit hash in the filename. The note itself may be added by
amending the commit, which changes the hash and makes hash-based filenames chase
their own tail.
