# Pipeline Resource Disposal

Pipelines need cleanup rules as much as parsing rules.

Composed tools open files, streams, sockets, temp paths, and child processes.
If disposal is informal, every pipeline has a leak-shaped footnote.

## The JavaScript Idiom

Cleanup is usually ad hoc.

```js
const stream = createWriteStream(path)

try {
  await writeRecords(stream, records)
}
finally {
  stream.close()
}
```

That works until a stream already ended, an fd is closed underneath it, or a
tool tries to reuse a disposed resource.

## Declarative Translation

Wrap resources in a small lifecycle protocol.

```js
const disposer = new CliStreamDisposer(stream)

await writeRecords(disposer.resource, records)
await disposer.dispose()
```

The protocol can make invalid lifecycle states explicit:

```js
disposer.isDisposed // true
disposer.resource // throws "Resource is disposed"
```

## Why This Matters

This is not glamorous, but it is pipeline infrastructure. A debuggable workflow
needs to know when a resource was closed, whether disposal succeeded, and why a
second use is invalid.

That makes CLI tools safer to compose locally and safer to automate remotely.
