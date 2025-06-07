import { AbortError } from "@kingjs/abort-error"
import { Disposer } from '@kingjs/disposer'
import { CharDecoder } from '@kingjs/char-decoder'
import { StringDecoder } from 'string_decoder'
import { Readable } from "stream"

const disposer = new Disposer(
  readable => new Promise(resolve => readable.destroy(null, resolve)), { 
  disposedFn: readable => readable.closed,
  event: 'close',
})

const devNull = Readable.from(Buffer.alloc(0))

export function sip(source, { signal } = { }) {
  const abort = async () => 
    await source.destroy()
  let chunkIterator = (async function*() {
    try {
      if (signal?.aborted) return await abort()
      signal?.addEventListener('abort', abort, { once: true })

      for await (const chunk of source) {
        if (signal?.aborted) return
        yield chunk
      }
    } 
    finally {
      signal?.removeEventListener('abort', abort)
      if (signal?.aborted) throw new AbortError()
    }
  })()

  let i = 0
  let bytes = Buffer.alloc(0)
  const byteIterator = (async function*() {
    while (true) {
      const { done, value: nextChunk } = await chunkIterator.next()
      if (done) break
      bytes = nextChunk
      i = 0

      // yield the next byte
      while (i < bytes.length)
        yield bytes[i++]
    }
  })()
  
  const decoder = new CharDecoder()
  let charIterator = (async function*() {
    while (true) {
      const { done, value: byte } = await byteIterator.next()
      if (done) break
      decoder.push(byte)
      if (decoder.canStringify)
        yield { eof: false, decoder }
    }

    if (!decoder.canStringify)
      throw new Error(
        'Stream ended before a character boundary was found.')
    yield { eof: true, decoder }
  })()
  
  const stopSipping = async () => {
    const buffers = []

    await byteIterator.return()
    buffers.push(decoder.buffer)
    decoder.clear()
    
    await charIterator.return()
    buffers.push(bytes.slice(i))
    bytes = Buffer.alloc(0)
    i = 0

    return buffers.filter(buffer => buffer.length > 0)
  }

  const restIterator = async function* () {
    // stop sipping bytes
    const buffers = await stopSipping()

    // start gulping chunks
    yield* buffers
    yield* chunkIterator
  }

  charIterator.rest = async () => {
    const chunks = []
    for await (const buffer of restIterator())
      chunks.push(buffer)
    return new StringDecoder('utf8').end(Buffer.concat(chunks))
  }

  charIterator.pipe = async (target, { end = true } = { }) => {
    // return promise that throws if either stream errors
    return new Promise((resolve, reject) => {
      const source = Readable.from(restIterator())
      source.on('error', reject)
      target.on('error', reject)
      source.on('end', resolve)
      source.pipe(target, { end })
    })
  }

  charIterator.dispose = async () => {
    await stopSipping()
    await disposer.dispose(source, { signal })
  }

  return charIterator
}
