import { assert } from '@kingjs/assert'

function bufferOf(span) {
  assert(ArrayBuffer.isView(span) && span.BYTES_PER_ELEMENT == 1,
    'String materialization span must be bytes.')

  return new Uint8Array(span.buffer, span.byteOffset, span.byteLength)
}

export function byteOrderedEncodingOf(encoding, byteOrder) {
  switch (encoding) {
    case 'utf-16':
      switch (byteOrder) {
        case 'big': return 'utf-16be'
        case 'little': return 'utf-16le'
      }
      break
    case 'utf-32':
      switch (byteOrder) {
        case 'big': return 'utf-32be'
        case 'little': return 'utf-32le'
      }
      break
  }

  throw new Error('String materialization encoding is not supported.')
}

export function* byteSpansToStrings(spans, encoding) {
  if (encoding == 'utf-32be' || encoding == 'utf-32le')
    throw new Error('UTF-32 string materialization is not supported.')

  let decoder = null

  for (const span of spans) {
    decoder ??= new TextDecoder(encoding)

    const decoded = decoder.decode(bufferOf(span), {
      stream: true,
    })

    if (decoded)
      yield decoded
  }

  const tail = decoder?.decode()
  if (tail)
    yield tail
}
