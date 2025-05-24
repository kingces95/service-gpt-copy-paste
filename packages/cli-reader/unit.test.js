import { CliReader } from './index.js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toBeEquals } from '@kingjs/vitest'
import { Readable } from 'stream'

expect.extend({ toBeEquals })

describe('A cli reader', () => {
  describe('passed an empty stream', () => {
    let reader
    beforeEach(() => {
      const readable = Readable.from(Buffer.from(''))
      reader = new CliReader(readable)
    })
    
    it('should return an empty string when readString is called with 0', async () => {
      const result = await reader.readString(0)
      expect(result).toBe('')
    })
    it('should return an empty string when read is called', async () => {
      const result = await reader.read()
      expect(result).toBe('')
    })
  })
})