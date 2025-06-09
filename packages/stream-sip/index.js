import { AbortError } from "@kingjs/abort-error"
import { Disposer } from '@kingjs/disposer'
import { CharDecoder } from '@kingjs/char-decoder'
import { StringDecoder } from 'string_decoder'
import { Readable, Writable } from "stream"

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

class Sipper {
  #source
  #encoding
  #chunkIterator
  #byteIterator
  #charIterator

  constructor(source, { encoding = 'utf8' } = {}) {
    this.#source = source
    this.#encoding = encoding
    this.#chunkIterator = source[Symbol.asyncIterator]()
    this.#byteIterator = this.#createByteIterator()
    this.#charIterator = this.#createCharIterator()
  }

  #createByteIterator() {
    const chunkIterator = this.#chunkIterator
    return (async function* () {
      let i = 0
      let bytes = Buffer.alloc(0)
      let unwinding = false
      try {
        while (true) {
          const { done, value: nextChunk } = await chunkIterator.next()
          if (done) break
          bytes = nextChunk
          i = 0

          while (i < bytes.length)
            yield bytes[i++]
        }
      } catch (error) {
        unwinding = true
        throw error
      } finally {
        if (!unwinding) {
          return { started: true, buffers: [bytes.slice(i)] }
        }
      }
    })()
  }

  #createCharIterator() {
    const decoder = new CharDecoder(this.#encoding)
    const byteIterator = this.#byteIterator

    return (async function* () {
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
          throw new Error('Stream ended before a character boundary was found.')

        yield { eof: true, decoder }
        done = true
      } catch (error) {
        unwinding = true
        decoder.clear()
        throw error
      } finally {
        const interrupted = !(unwinding || done)
        if (interrupted) {
          const { value: { started, buffers = [] } = {} } = await byteIterator.return()
          return { started, buffers: [decoder.buffer, ...buffers] }
        }
      }
    })()
  }

  async pipe(consumer, { end = true } = {}) {
    const { value: { started, buffers = [] } = {} } 
      = await this.#charIterator.return() ?? {}

    const producer = started || this.#source.closed
      ? Readable.from((async function* () {
          yield* buffers
          yield* this.#chunkIterator
        }).call(this))
      : this.#source

    return await new Promise((resolve, reject) => {
      producer.on('error', reject)
      producer.on('close', () => resolve(consumer))
      producer.pipe(consumer, { end })
    })
  }

  async readAll() {
    return (await this.pipe(new Gulp())).toString(this.#encoding)
  }

  async dispose({ signal } = {}) {
    await disposer.dispose(this.#source, { signal })
  }

  async next(...args) {
    return this.#charIterator.next(...args)
  }

  async return(...args) {
    return this.#charIterator.return(...args)
  }

  async throw(...args) {
    return this.#charIterator.throw(...args)
  }

  [Symbol.asyncIterator]() {
    return this;
  }
}

export function sip(source, options) {
  return new Sipper(source, options)
}
