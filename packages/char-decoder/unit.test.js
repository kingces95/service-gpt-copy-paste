// hello world
import { CharDecoder } from './index.js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toBeEquals } from '@kingjs/vitest'

expect.extend({ toBeEquals })

const NEW_LINE_BYTE = 0x0A

describe('CharDecoder', () => {
  it('should throw if pushed an invalid byte', () => {
    const buffer = new CharDecoder()
    expect(() => buffer.push(0xFF)).toThrow('Invalid UTF-8 start byte')
  })
  it('should throw if constructed with an unsupported encoding', () => {
    expect(() => new CharDecoder('unsupported-encoding'))
      .toThrow('Unsupported encoding: unsupported-encoding')
  })
  describe('that is empty', () => {
    let buffer

    beforeEach(() => {
      buffer = new CharDecoder()
    })

    it('should have length 0', () => {
      expect(buffer.length).toBe(0)
    })
    it('should return null on peek', () => {
      expect(buffer.peek()).toBeNull()
    })
    it('should throw on pop', () => {
      expect(() => buffer.pop()).toThrow('No bytes to pop.')
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
      buffer = new CharDecoder()
      buffer.push(NEW_LINE_BYTE)
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
      buffer = new CharDecoder()
      const helloWorldBytes = Buffer.from('hello world', 'utf8')
      for (const byte of helloWorldBytes) {
        buffer.push(byte)
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
    const partialMultiByteCharBytes = Buffer.from([0xC3]) // Start of "é"

    beforeEach(() => {
      buffer = new CharDecoder()
      for (const byte of partialMultiByteCharBytes) {
        buffer.push(byte)
      }
    })

    it('should have zero length', () => {
      expect(buffer.length).toBe(0)
    })
    it('should return last byte pushed on peek', () => {
      expect(buffer.peek()).toBe(partialMultiByteCharBytes[0]) // 0xC3
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
    let multiByteCharBytes = Buffer.from('é', 'utf8') // U+00E9

    beforeEach(() => {
      buffer = new CharDecoder()
      for (const byte of multiByteCharBytes) {
        buffer.push(byte)
      }
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return the second byte of the two byte char', () => {
      expect(buffer.peek()).toBe(multiByteCharBytes[1]) // 'é' in UTF-8
    })
    it('should throw on pop', () => {
      expect(() => buffer.pop())
        .toThrow('Cannot pop a multi-byte character as a byte.')
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
    const threeByteCharBytes = Buffer.from('€', 'utf8') // U+10300

    beforeEach(() => {
      buffer = new CharDecoder()
      for (const byte of threeByteCharBytes) {
        buffer.push(byte)
      }
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return last byte pushed on peek', () => {
      expect(buffer.peek()).toBe(threeByteCharBytes[2]) // '€' in UTF-8
    })
    it('should throw on pop', () => {
      expect(() => buffer.pop())
        .toThrow('Cannot pop a multi-byte character as a byte.')
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
    const fourByteCharBytes = Buffer.from('𐍈', 'utf8') // U+10300

    beforeEach(() => {
      buffer = new CharDecoder()
      for (const byte of fourByteCharBytes) {
        buffer.push(byte)
      }
    })

    it('should have length 1', () => {
      expect(buffer.length).toBe(1)
    })
    it('should return last byte pushed on peek', () => {
      expect(buffer.peek()).toBe(fourByteCharBytes[3]) // '𐍈' in UTF-8
    })
    it('should throw on pop', () => {
      expect(() => buffer.pop())
        .toThrow('Cannot pop a multi-byte character as a byte.')
    })
    it('should return "𐍈" on toString', () => {
      expect(buffer.toString()).toBe('𐍈')
    })
    it('should return true for canStringify', () => {
      expect(buffer.canStringify).toBe(true)
    })
  })
})
