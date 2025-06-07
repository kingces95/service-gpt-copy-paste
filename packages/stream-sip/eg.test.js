// hello world
import { sip } from './index.js'
import { CharDecoder } from '@kingjs/char-decoder'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toBeEquals } from '@kingjs/vitest'
import { Readable } from 'stream'
import { createReadStream } from 'fs'
import { fileURLToPath } from 'url'

// Resolve current file path
const __filename = fileURLToPath(import.meta.url)

expect.extend({ toBeEquals })

const NEW_LINE_BYTE = 0x0A
const CARRAGE_RETURN_BYTE = 0x0D 

describe('A code sample of sip', () => {
  describe('with a stream containing "hello world"', () => {
    it('should yield a buffer with "hello world".', async () => {
      const readable = Readable.from([Buffer.from('hello world', 'utf8')])
      const asyncIterator = sip(readable)
      let count = 0
      for await (const { eof, decoder } of asyncIterator) {
        if (!eof) {
          count++
          expect(decoder).toBeInstanceOf(CharDecoder)
          expect(decoder.canStringify).toBe(true)
          expect(decoder.length).toBe(count)
          expect(decoder.toString()).toBe('hello world'.slice(0, count))
        } else {
          expect(decoder.length).toBe(11) // "hello world" has 11 characters
          expect(decoder.toString()).toBe('hello world')
        }
      }
    })
  })
  describe('with a stream containing two lines', () => {
    it('should yield the lines without the new line character.', async () => {
      const readable = Readable.from(
        [Buffer.from('hello world\nnext line\n', 'utf8')])
      
      async function *lines() {
        const asyncIterator = sip(readable)
        for await (const { eof, decoder } of asyncIterator) {
          // if end-of-file, yield the remaining buffer
          if (eof && !decoder.length)
            return

          // if new line, then yield line and reset
          if (decoder.peek() === NEW_LINE_BYTE) {
            decoder.pop() // remove the new line byte
            yield decoder.toString()
            decoder.clear()
          }
        }
      }

      const iterator = lines()
      expect(await iterator.next()).toEqual({
        done: false,
        value: 'hello world'
      })
      expect(await iterator.next()).toEqual({
        done: false,
        value: 'next line'
      })
      expect(await iterator.next()).toEqual({
        done: true,
        value: undefined
      })
    })
  })
  describe('from this file', () => {
    it('should yield "// hello world".', async () => {
      // open this file as a readable stream using meta to get the path
      const readable = createReadStream(__filename)
      const asyncIterator = sip(readable)
      
      for await (const { decoder } of asyncIterator) {
        // if new line then break
        if (decoder.peek() === NEW_LINE_BYTE) {
          decoder.pop() // remove the new line byte
          if (decoder.peek() === CARRAGE_RETURN_BYTE)
            decoder.pop() // remove the carriage return byte
          expect(decoder.toString()).toBe('// hello world')
          break
        }
      }
    })
  })
  describe('with a stream that hangs', () => {
    it('should be abortable with a signal.', async () => {
      const controller = new AbortController()
      const { signal } = controller
      setTimeout(() => 
        controller.abort(), 10)

      const stream = new Readable({ read() { } })
      
      await expect(async () => {
        for await (const _ of sip(stream, { signal })) {
          // This should not be reached
          expect(true).toBe(false)
        }
      }).rejects.toThrow('Aborted')
    })
  })
})
