// hello world
import { ByteSlidingWindow, ByteSlidingWindowCursor } from './index.js'
import { describe, it, expect, beforeEach } from 'vitest'
import { toBeEquals, starsAndBars } from '@kingjs/vitest'
import { distance, advance } from '@kingjs/cursor'

expect.extend({ toBeEquals })

const buffer4 = Buffer.from('0123', 'utf8')

// read function metadata 
const readMd = {
  readUInt8: { signed: false, size: 1 },
  readUInt16LE: { signed: false, size: 2, littleEndian: true },
  readUInt16BE: { signed: false, size: 2, littleEndian: false },
  readUInt32LE: { signed: false, size: 4, littleEndian: true },
  readUInt32BE: { signed: false, size: 4, littleEndian: false },
  
  readInt8: { signed: true, size: 1 },
  readInt16LE: { signed: true, size: 2, littleEndian: true },
  readInt16BE: { signed: true, size: 2, littleEndian: false },
  readInt32LE: { signed: true, size: 4, littleEndian: true },
  readInt32BE: { signed: true, size: 4, littleEndian: false },
}

describe('A ByteSlidingWindow', () => {
  let window
  beforeEach(() => {
    window = new ByteSlidingWindow()
  })
  it('should have count of 0', () => {
    expect(window.count).toBe(0)
  })
  describe.each([
    1, 2, 3, 4
  ])('consuming a %i byte buffer', (byteCount) => {
    const buffer = buffer4.slice(0, byteCount)
    const bufferLength = buffer.length

    describe.each([
      ...range(1, bufferLength)
    ])('split into %i buffers', (splitCount) => {
      let chunks
      beforeEach(() => {
        chunks = []
      })

      describe.each([...[
        ...starsAndBars(byteCount, splitCount - 1, { minStars: 1 }),
        ].map(o => [o])
      ])('distributed as %j', (bytesPerChunk) => {
        beforeEach(() => {
          for(let i = 0, j = 0; i < splitCount; i++) {
            const bytesInChunk = bytesPerChunk[i]
            const chunk = buffer.slice(j, j + bytesInChunk)
            chunks.push(chunk)
            j += bytesInChunk
          }

          window.push(Buffer.alloc(0))
          for (const chunk of chunks) {
            window.push(chunk)
          }        
        })
        it('should have the expected count.', () => {
          expect(window.count).toBe(byteCount)
        })
        describe.each([
          ...range(0, byteCount - 1)
        ])('shift %i bytes', (shift) => {
          const remainingByteCount = byteCount - shift
          let result
          beforeEach(() => {

            const current = window.begin()
            advance(current, shift)
            result = window.shift(current)
          })
          it('should have the same byte count.', () => {
            expect(window.count).toBe(byteCount)
          })
          it('should return a slice of the buffer.', () => {
            const expected = buffer.slice(0, shift)
            const concat = Buffer.concat(result)
            expect(concat).toEqual(expected)
          })
          it('should have the expected length.', () => {
            expect(distance(window.begin(), window.end()))
              .toBe(remainingByteCount)
          })
          it('should successfully iterate through the buffer length.', () => {
            const cursor = window.begin()
            for (let i = shift, value = cursor.next();
              i < bufferLength; 
              i++, value = cursor.next()) {
              expect(value).toBe(buffer[i])
            }
            expect(cursor.isEnd).toBe(true)
          })
          it('should successfully step through the buffer length.', () => {
            const cursor = window.begin()
            for (let i = shift; i < bufferLength; i++) {
              expect(cursor.value).toBe(buffer[i])
              cursor.step()
            }
            expect(cursor.isEnd).toBe(true)
          })
          it('should successfully step back through the buffer length.', () => {
            const cursor = window.end()
            for (let i = bufferLength - 1; i >= shift; i--) {
              cursor.stepBack()
              expect(cursor.value).toBe(buffer[i])
            }
            expect(cursor.isBegin).toBe(true)
          })
          describe.each([
            ...range(shift, bufferLength - 1)
          ])('after %i steps', (steps) => {
            let current
            let begin
            beforeEach(() => {
              begin = window.begin()
              current = begin.clone()
              for (let i = 0; i < steps; i++) 
                current.step()
            })
            it('should compare to the original buffer', () => {
              expect(begin.equals(current)).toEqual(steps == 0)
            })
            it('should throw if read length grether than 4', () => {
              expect(() => current.read(5)).toThrow(
                'Unsupported length: 5. Only 1, 2, or 4 bytes are supported.')
            })
            it.each(
              Object.entries(readMd)
              .filter(([name, { size }]) => shift + size + steps <= bufferLength)
              .map(([name, { signed, size, littleEndian }]) => 
                [ name, signed, size, littleEndian ])
            )(`%s() should match`, (name) => {
              const read = buffer[name](shift + steps)
              expect(current[name]()).toBe(read)
            })
            it.each(
              Object.entries(readMd)
              .filter(([name, { size }]) => shift + size + steps > bufferLength)
              .map(([name, { signed, size, littleEndian }]) => 
                [ name, signed, size, littleEndian ])
            )(`%s() should be undefined`, (name) => {
              expect(current[name]()).toBe(undefined)
            })
          })        
        })
      })
    })
  })
})

function* range(start, end) {
  if (start > end) return
  for (let i = start; i <= end; i++)
    yield i
}

