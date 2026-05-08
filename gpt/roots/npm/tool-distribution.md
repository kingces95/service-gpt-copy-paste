# Tool Distribution

## Original Idea

NPM packages can expose command-line binaries.

Original style:

```json
{
  "name": "trello-tool",
  "bin": {
    "trello": "./bin/trello.js"
  }
}
```

Users install tools with:

```bash
npm install -g trello-tool
trello --help
```

## Local Translation

The project treats npm-published CLIs as a community-friendly way to add AI
tools to an environment.

Example:

```bash
npm install @acme/gmail-cli @acme/trello-cli @acme/pdf-cli
gmail --help
trello --help
pdf --help
```

## Why It Matters

The ecosystem boundary stays neutral. Tool authors can use ordinary JavaScript
packaging and do not need to learn a custom agent plugin framework.
