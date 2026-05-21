# Field Type Schema

Tiny command fields deserve tiny schemas.

CLI input usually starts as strings, but every useful command quickly needs
numbers, booleans, enums, comments, aliases, and defaults. Field types make
that conversion declarative.

## The JavaScript Idiom

Argument parsing code tends to scatter conversion rules.

```js
const count = Number(args[0])
const enabled = args[1] == 'true' || args[1] == 'yes'
const label = args.slice(2).join(' ')
```

Each command re-decides what a number is, what truth means, and how comments
or remaining text should be handled.

## Declarative Translation

Use named field types.

```js
const Fields = {
  count: 'number',
  enabled: 'boolean',
  label: 'comment',
}

const record = await parseLine('42 true # first run', Fields)
```

Aliases can keep the command-line surface compact:

```js
CliFieldType.getType('#') // number
CliFieldType.getType('!') // boolean
CliFieldType.getType('?') // word
```

## Why This Matters

The schema is small enough to feel like shell, but explicit enough to power
validation and help.

This is the CLI version of the broader project move: the rules were already
there, so promote them into data that can be reflected.
