# read and IFS

## Original Idea

Bash `read` consumes text from stdin, splits fields according to IFS, assigns
fields to variables, and leaves the rest of the byte stream for later consumers.

Original style:

```bash
IFS=', ' read first rest
```

Important behavior:

- whitespace IFS and non-whitespace IFS behave differently
- the last variable receives remaining content
- comments or rest fields may consume the remainder
- byte stream position matters

## Local Translation

The local equivalent is `CliParser`, `CliSplitter`, and record metadata.

Example style:

```js
CliParser.parse('42 false # note', {
  count: '#',
  enabled: '!',
  note: '*',
})
```

Expected shape:

```js
{
  count: 42,
  enabled: false,
  note: '# note',
}
```

## Why It Matters

The shell interop dream requires exact control over what has been consumed from
a stream. Node's text decoding and stream batching do not naturally expose the
same byte/codepoint boundary control, which motivates cursor and decoder work.
