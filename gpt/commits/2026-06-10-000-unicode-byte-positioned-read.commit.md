# Unicode Byte-Positioned Read

This work supports a bash-style `read` emulator: consume byte ranges from
native stream APIs, scan decoded text without losing byte provenance, and
commit exactly the bytes that produced a record.

The invariant is byte ownership: bytes are buffered once while speculative,
decoded into code points for scanning, and returned as byte ranges when
committed. A parser can scan for record tokens in code-point space, but the
committed result still knows the exact source byte ranges that produced those
code points.

String materialization is a terminal operation. The scanner does not
concatenate strings while searching; committed UTF-8/16 ranges can stream
through decoder infrastructure as string chunks, or materialize once at the
boundary where the caller asks for a string. UTF-32 exposes the same terminal
surface and reports that platform string materialization is unsupported.

Unicode preambles are stream metadata. UTF-16/32 byte-order marks configure
byte-order decoding and are consumed before code units are exposed. UTF-8
signatures are consumed as magic and are not surfaced as `U+FEFF`.

Native byte search is allowed as an optimization when the range exposes byte
spans. The semantic search is still in range/cursor space, but span projections
let the implementation use native byte scanners and then recover exact cursors
for the match.

## Notes

Range containers model a range of source ranges and preserve cursor provenance
through `split`, `popRange`, `ranges`, and `spans`.

Projected range containers layer bytes, code units, and code points without
copying the underlying byte ranges.

`TypedArrayView` provides a no-copy view over native typed arrays, suitable for
stream chunks.

`SizedIterableProbe` and span-projected range shapes name the contracts used by
sequence search and byte-span optimization.

Follow-up quests capture receiver-owned fields/effects, cached end cursors,
native delimiter search, and stream data error policy.
