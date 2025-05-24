// hello world
import { sip, Utf8CharBuffer } from './index.js'
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

describe('Utf8CharBuffer', () => {
  it('should throw if pushed an invalid byte', () => {
    const buffer = new Utf8CharBuffer()
    expect(() => buffer.push$(0xFF)).toThrow('Invalid UTF-8 start byte')
  })
  describe('that is empty', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
    })

    it('should have length 0', () => {
      expect(buffer.length).toBe(0)
    })
    it('should return null for peek', () => {
      expect(buffer.peek()).toBeNull()
    })
    it('should throw on pop', () => {
      expect(() => buffer.pop()).toThrow('Buffer is empty')
    })
    it('should return empty string on toString', () => {
      expect(buffer.toString()).toBe('')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
  describe('that has a new line character', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
      buffer.push$(NEW_LINE_BYTE)
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return the new line byte on peek', () => {
      expect(buffer.peek()).toBe(NEW_LINE_BYTE)
    })
    it('should return the new line byte on pop', () => {
      expect(buffer.pop()).toBe(NEW_LINE_BYTE)
    })
    it('should return empty string on toString', () => {
      expect(buffer.toString()).toBe('\n')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
  describe('that has "hello world" in UTF-8', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
      const helloWorldBytes = Buffer.from('hello world', 'utf8')
      for (const byte of helloWorldBytes) {
        buffer.push$(byte)
      }
    })

    it('should have length 11', () => {
      expect(buffer.length).toBe(11)
    })
    it('should return "d" on peek', () => {
      expect(buffer.peek()).toBe(100) // 'd' in UTF-8
    })
    it('should return "hello world" on toString', () => {
      expect(buffer.toString()).toBe('hello world')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
  describe('that has a partial multi-byte character', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
      const partialMultiByteCharBytes = Buffer.from([0xC3]) // Start of "é"
      for (const byte of partialMultiByteCharBytes) {
        buffer.push$(byte)
      }
    })

    it('should throw on length', () => {
      expect(() => buffer.length).toThrow('UTF-8 character incomplete')
    })
    it('should throw on peek', () => {
      expect(() => buffer.peek()).toThrow('UTF-8 character incomplete')
    })
    it('should throw on pop', () => {
      expect(() => buffer.pop()).toThrow('UTF-8 character incomplete')
    })
    it('should throw on toString', () => {
      expect(() => buffer.toString()).toThrow('UTF-8 character incomplete')
    })
  })
  describe('that has a two byte character "é" in UTF-8', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
      const multiByteCharBytes = Buffer.from('é', 'utf8')
      for (const byte of multiByteCharBytes) {
        buffer.push$(byte)
      }
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return null on peek', () => {
      expect(buffer.peek()).toBeNull()
    })
    it('should return "é" on toString', () => {
      expect(buffer.toString()).toBe('é')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
  describe('that has a three byte character "€" in UTF-8', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
      const threeByteCharBytes = Buffer.from('€', 'utf8') // U+10300
      for (const byte of threeByteCharBytes) {
        buffer.push$(byte)
      }
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return null on peek', () => {
      expect(buffer.peek()).toBeNull()
    })
    it('should return "€" on toString', () => {
      expect(buffer.toString()).toBe('€')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
  describe('that has a four byte character "𐍈" in UTF-8', () => {
    let buffer

    beforeEach(() => {
      buffer = new Utf8CharBuffer()
      const fourByteCharBytes = Buffer.from('𐍈', 'utf8') // U+10300
      for (const byte of fourByteCharBytes) {
        buffer.push$(byte)
      }
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return null on peek', () => {
      expect(buffer.peek()).toBeNull()
    })
    it('should return "𐍈" on toString', () => {
      expect(buffer.toString()).toBe('𐍈')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
})
  
describe('sip', () => {
  describe('with an empty stream', () => {
    it('should not yield a buffer', async () => {
      const emptyReadable = Readable.from([])
      const asyncIterator = sip(emptyReadable)
      expect(asyncIterator.next()).resolves.toEqual({
        done: true,
        value: undefined
      })
    })
  })
  describe('with a stream containing "hello world"', () => {
    it('should yield a buffer with "hello world"', async () => {
      const readable = Readable.from([Buffer.from('hello world', 'utf8')])
      const asyncIterator = sip(readable)
      let buffer = null
      let count = 0
      for await (buffer of asyncIterator) {
        count++
        expect(buffer).toBeInstanceOf(Utf8CharBuffer)
        expect(buffer.canStringify).toBe(true)
        expect(buffer.length).toBe(count)
        expect(buffer.toString()).toBe('hello world'.slice(0, count))
      }
      expect(count).toBe(11) // "hello world" has 11 characters
      expect(buffer.toString()).toBe('hello world')
    })
  })
  describe('simulating a shell', () => {
    it('should yield the line without the new line character', async () => {
      const readable = Readable.from([Buffer.from('hello world\nnext line\n', 'utf8')])
      const asyncIterator = sip(readable)
      let buffer = null
      for await (buffer of asyncIterator) {
        // if new line then break
        if (buffer.peek() === NEW_LINE_BYTE) {
          buffer.pop() // remove the new line byte
          break
        }
      }
      expect(buffer.toString()).toBe('hello world')
    })
  })
  describe('from this file', () => {
    it('should yield "// hello world".', async () => {
      // open this file as a readable stream using meta to get the path
      const readable = createReadStream(__filename)
      const asyncIterator = sip(readable)
      let buffer = null
      for await (buffer of asyncIterator) {
        // if new line then break
        if (buffer.peek() === NEW_LINE_BYTE) {
          buffer.pop() // remove the new line byte
          if (buffer.peek() === CARRAGE_RETURN_BYTE)
            buffer.pop() // remove the carriage return byte
          break
        }
      }
      expect(buffer.toString()).toBe('// hello world')
    })
  })
  describe('with a stream that hangs', () => {
    it('should be abortable with a signal', async () => {
      const controller = new AbortController()
      const { signal } = controller
      setTimeout(() => controller.abort(), 10)

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
