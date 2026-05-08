# Help From Metadata

Documentation should fall out of the command declaration.

The best CLI help feels inevitable: command groups, parameters, defaults, and
allowed values all line up because they come from the same model the runtime
uses.

## The JavaScript Idiom

Help text is often a second implementation of the command.

```js
function run(args) {
  // parse args here
}

function help() {
  return `
Usage:
  todo add <title> [--due <date>]
`
}
```

The command and its docs can drift immediately.

## Declarative Translation

Declare the command shape once.

```js
class TodoCommands extends CliGroup {
  static [Commands] = {
    add: {
      args: {
        title: 'comment',
        due: DateField,
      },
      run({ title, due }) {
        return todo.add({ title, due })
      },
    },
  }
}
```

Then `-h` can be generated from the same declaration:

```txt
todo add <title> [--due <date>]
```

## Why This Matters

This is the Azure CLI inspiration: nested command surfaces feel large but still
discoverable because the hierarchy and parameters are data.

Once help is generated from metadata, humans and AI can inspect the same
surface before executing anything.

## Lineage

Azure CLI is the familiar shape here. Nested command groups and rich `-h`
output work because commands are organized as inspectable hierarchy, not just a
bag of argument handlers.

```txt
az storage blob upload -h
```

The JavaScript translation is a command tree whose metadata can generate help:

```js
class StorageCommands extends CliGroup {
  static [Commands] = { blob: BlobCommands }
}
```
