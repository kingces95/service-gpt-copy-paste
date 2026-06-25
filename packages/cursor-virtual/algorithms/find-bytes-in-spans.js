import { Buffer } from 'node:buffer'
import { assert } from '@kingjs/assert'

export function findBytesInSpans(spans, needle) {
  assert(needle instanceof Uint8Array,
    'Byte sequence search requires a Uint8Array needle.')

  if (needle.length == 0)
    return null

  let previousSpan = null
  let previousSpanIndex = -1
  let spanIndex = 0

  for (const span of spans) {
    if (previousSpan) {
      const spanOffset = findCrossSpanSequence(previousSpan, span, needle)
      if (spanOffset != null)
        return { spanIndex: previousSpanIndex, spanOffset }
    }

    const spanOffset = Buffer
      .from(span.buffer, span.byteOffset, span.byteLength)
      .indexOf(needle)

    if (spanOffset >= 0)
      return { spanIndex, spanOffset }

    previousSpan = span
    previousSpanIndex = spanIndex++
  }

  return null
}

function findCrossSpanSequence(front, back, needle) {
  const suffixLength = Math.min(needle.length - 1, front.length)
  const prefixLength = Math.min(needle.length - 1, back.length)

  if (suffixLength == 0 || prefixLength == 0)
    return null

  const window = new Uint8Array(suffixLength + prefixLength)
  window.set(front.subarray(front.length - suffixLength), 0)
  window.set(back.subarray(0, prefixLength), suffixLength)

  const match = findBytesInSpans([window], needle)
  if (!match || match.spanOffset >= suffixLength)
    return null

  return front.length - suffixLength + match.spanOffset
}
