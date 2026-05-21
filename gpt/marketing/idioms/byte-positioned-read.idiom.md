# Byte Positioned Read

If a tool reads bytes, it should know exactly where it stopped.

Unix composition depends on handing unread input to the next tool. Text
decoders usually hide buffering, which makes exact byte handoff surprisingly
hard.

## The JavaScript Idiom

Node stream decoding is comfortable when one process owns the whole stream.

```js
for await (const chunk of stream)
  text += decoder.write(chunk)
```

But a Bash-like `read` wants to stop after a logical field or line and leave
the rest of the byte stream for another consumer.

## Declarative Translation

Model decoding as cursorable byte and codepoint windows.

```js
const bytes = new ByteSlidingWindow()
const chars = new CodePointSlidingWindow(bytes)

while (!chars.begin().equals(chars.end())) {
  const cursor = chars.begin()
  if (cursor.value == newline) break
  cursor.step()
}
```

The parser can know both the decoded character position and the underlying byte
position where it stopped.

## Why This Matters

This generalizes the pain behind "I just want Bash `read`, but in JS." The
hard part is not reading text; it is preserving enough byte accountability to
compose with the next tool.

Cursor windows give the decoder an STL-ish traversal surface and the shell
interop layer a Unix-ish handoff story.

## Lineage

Unix pipelines and Bash `read` are the source pressure. A tool should consume
exactly what it owns and leave the rest of the byte stream fit for the next
tool.

```sh
read header
next-tool
```

The JavaScript translation tracks decoded codepoints without losing byte
position:

```js
const bytes = new ByteSlidingWindow()
const chars = new CodePointSlidingWindow(bytes)
```
