import { AbortError } from "@kingjs/abort-error"
import { Disposer } from '@kingjs/disposer'
import { CharDecoder } from '@kingjs/char-decoder'
import { StringDecoder } from 'string_decoder'
import { Readable, Writable } from "stream"
import { sign } from "crypto"

const disposer = new Disposer(
  readable => new Promise(resolve => readable.destroy(null, resolve)), { 
  disposedFn: readable => readable.closed,
  event: 'close',
})

class Gulp extends Writable {
  #chunks = []

  _write(chunk, encoding, callback) {
    this.#chunks.push(chunk)
    callback()
  }

  toString(encoding) {
    const decoder = new StringDecoder(encoding)
    return decoder.end(Buffer.concat(this.#chunks))
  }
} 

export function sip(source, { encoding = 'utf8' } = { }) {
  const chunkIterator = source[Symbol.asyncIterator]()

  const byteIterator = (async function*() {
    let i = 0
    let bytes = Buffer.alloc(0)
    let unwinding = false
    try {
      while (true) {
        const { done, value: nextChunk } = await chunkIterator.next()
        if (done) break
        bytes = nextChunk
        i = 0
  
        // yield the next byte
        while (i < bytes.length)
          yield bytes[i++]
      }
    } 
    catch (error) { 
      unwinding = true
      throw error 
    }
    finally {
      if (!unwinding) {
        return { started: true, buffers: [ bytes.slice(i) ] }
      }
    }
  })()
  
  let charIterator = (async function*() {
    const decoder = new CharDecoder(encoding)

    let unwinding = false
    let done = false
    try {
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
      done = true
    }
    catch (error) { 
      unwinding = true
      decoder.clear() // clear the decoder
      throw error 
    }
    finally {
      const interrupted = !(unwinding || done) // e.g. .return() called
      if (interrupted) {
        const { 
          value: { started, buffers = [] } = { } 
        } = await byteIterator.return()

        return { started, buffers: [ decoder.buffer, ...buffers ] }
      }
    }
  })()

  charIterator.pipe = async (consumer, { end = true } = { }) => {
    const { 
      value: { started, buffers = [] } = { } 
    } = await charIterator.return() ?? { }

    const producer = started || source.closed
      ? Readable.from((async function* () {
          yield* buffers
          yield* chunkIterator
        })())
      : source // optimization

    // return promise that throws if either stream errors
    return await new Promise((resolve, reject) => {
      producer.on('error', reject)
      producer.on('close', () => resolve(consumer))
      producer.pipe(consumer, { end })
    })
  }

  charIterator.toString = async () => {
    return (await charIterator.pipe(new Gulp())).toString(encoding)
  }

  charIterator.dispose = async ({ signal } = { }) => {
    await disposer.dispose(source, { signal })
  }

  return charIterator
}
