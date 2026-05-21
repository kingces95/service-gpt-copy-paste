# Read Style Parser

Turn shell parsing rules into metadata instead of another bespoke split.

Bash `read` is useful because it maps a line of text into variables according
to a small protocol. The project translates that feeling into JavaScript
metadata.

## The JavaScript Idiom

A parser often starts with `split` and grows exceptions forever.

```js
const [name, ageText, ...commentWords] = line.trim().split(' ')

const record = {
  name,
  age: Number(ageText),
  comment: commentWords.join(' '),
}
```

Then comments, empty fields, alternate separators, booleans, discriminators,
and defaults all arrive as special cases.

## Declarative Translation

Describe the line shape.

```js
const PersonLine = {
  name: 'word',
  age: 'number',
  active: 'boolean',
  $: 'comment',
}

const record = await parseLine(line, PersonLine)
```

The same parser can support tuples, lists, named records, and discriminated
values:

```js
const EventLine = {
  type: ['create', 'update', 'comment'],
  _: {
    create: ['word', 'comment'],
    update: ['word', 'number', 'comment'],
    comment: ['comment'],
  },
}
```

## Why This Matters

The nagging problem is not splitting strings. The nagging problem is that every
script grows its own tiny, undocumented language.

Metadata makes the language visible. It can be parsed, reflected, tested, and
eventually printed in help text the same way Azure CLI prints command shapes.

## Lineage

Bash `read` plus IFS is the ancestor.

```sh
IFS=' ' read name age comment
```

The upgrade is making the field layout explicit enough for JavaScript parsing,
validation, help, and AI inspection:

```js
const PersonLine = {
  name: 'word',
  age: 'number',
  $: 'comment',
}
```
