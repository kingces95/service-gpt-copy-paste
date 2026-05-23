// hello world
import { 
  TrimmedSlidingWindow,
  CodeUnitSlidingWindow, 
  CodePointSlidingWindow,
} from './index.js'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, toBeDecodedAs, toText } from '@kingjs/vitest'

expect.extend({ toBeEquals, toBeDecodedAs })

class TestTrimmedSlidingWindow extends TrimmedSlidingWindow {
  trim$(innerCursor) {
    // no-op
  }
  next$(innerCursor) {
    const result = innerCursor.value
    if (result == null) return false // end of inner window
    innerCursor.step()
    return result
  }
  step$(innerCursor) {
    return innerCursor.step()
  }
  stepBack$(innerCursor) {
    return innerCursor.stepBack()
  }
}


const buffer4 = Buffer.from('0123', 'utf8')
const utf16BomLE = Buffer.from([0xFF, 0xFE])
const utf16BomBE = Buffer.from([0xFE, 0xFF])
const utf32BomLE = Buffer.from([0xFF, 0xFE, 0x00, 0x00])
const utf32BomBE = Buffer.from([0x00, 0x00, 0xFE, 0xFF])

describe('A CodePointSlidingWindow', () => {
  describe.each([
    ['little', 2, 'readUInt16LE', 'writeUInt16LE', utf16BomLE],
    ['big', 2, 'readUInt16BE', 'writeUInt16BE', utf16BomBE],
    ['little', 4, 'readUInt32LE', 'writeUInt32LE', utf32BomLE],
    ['big', 4, 'readUInt32BE', 'writeUInt32BE', utf32BomBE]
  ])('with %s endian %i unit length', 
    (endianess, unitLength, readFn, writeFn, byteOrderMarkBuffer) => {
    let window
    let littleEndian = endianess === 'little'
    beforeEach(() => {
      window = new CodeUnitSlidingWindow({ unitLength, littleEndian })
    })
    it('should have unit length of ' + unitLength, () => {
      expect(window.unitLength).toBe(unitLength)
    })
    it('should have undefined endianess', () => {
      expect(window.isLittleEndian).toBeUndefined()
    })
    describe('begin cursor', () => {
      let cursor
      beforeEach(() => {
        cursor = window.begin()
      })
      it('should be end', () => {
        expect(cursor.isEnd).toBe(true)
      })
    })    
    describe('given a buffer with leading byte order mark', () => {
      let buffer = Buffer.alloc(unitLength * 2)
      beforeEach(() => {
        buffer = Buffer.alloc(unitLength * 2)
        byteOrderMarkBuffer.copy(buffer, 0)
        buffer4.copy(buffer, unitLength) 
      })
      describe('pushing the full buffer', () => {
        beforeEach(() => {
          window.push(buffer)
        })
        it('should have endianess of ' + endianess, () => {
          expect(window.isLittleEndian).toBe(littleEndian)
        })
        describe('begin cursor', () => {
          let cursor
          beforeEach(() => {
            cursor = window.begin()
          })
          it('should have value equal to ' + readFn, () => {
            expect(cursor.value).toBe(buffer4[readFn](0))
          })
          describe('next', () => {
            beforeEach(() => {
              cursor.next()
            })
            it('should be undefined', () => {
              expect(cursor.value).toBeUndefined()
            })
          })
        })
      })
      describe('pushing a buffer with half the code units', () => {
        const buffer = buffer4.slice(0, unitLength / 2)
        beforeEach(() => {
          window.push(buffer)
        })
        it('should have undefined endianess', () => {
          expect(window.isLittleEndian).toBeUndefined()
        })
        describe('begin cursor', () => {
          let cursor
          beforeEach(() => {
            cursor = window.begin()
          })
          it('should be end', () => {
            expect(cursor.isEnd).toBe(true)
          })
        })
      })
    })
    describe('pushing a buffer with one code unit', () => {
      const buffer = buffer4.slice(0, unitLength)
      beforeEach(() => {
        window.push(buffer)
      })
      it('should have default endianess of ' + endianess, () => {
        expect(window.isLittleEndian).toBe(littleEndian)
      })
      describe('begin cursor', () => {
        let cursor
        beforeEach(() => {
          cursor = window.begin()
        })
        it('should have value equal to ' + readFn, () => {
          expect(cursor.value).toBe(buffer[readFn](0))
        })
        describe('next', () => {
          beforeEach(() => {
            cursor.next()
          })
          it('should be undefined', () => {
            expect(cursor.value).toBeUndefined()
          })
        })
      })
    })
  })
})
