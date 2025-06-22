// hello world
import { CharBuffer, CharPointer } from './index.js'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { toBeEquals, starsAndBars } from '@kingjs/vitest'
import { before } from 'lodash'

expect.extend({ toBeEquals })

const NEW_LINE_BYTE = 0x0A
const INVALID_UTF8_BYTE = 0xFF

const singleByteChar = 'm'
const twoByteChar = 'Ã'
const threeByteChar = '€'
const fourByteChar = '𐍈'
const multiByteChars = [
  singleByteChar,
  twoByteChar,
  threeByteChar,
  fourByteChar,
]

describe('Multi-byte character', () => {
  it('should be a single byte character', () => {
    const length = Buffer.from(singleByteChar, 'utf8').length
    expect(length).toBe(1)
  })
  it('should be a two byte character', () => {
    const length = Buffer.from(twoByteChar, 'utf8').length
    expect(length).toBe(2)
  })
  it('should be a three byte character', () => {
    const length = Buffer.from(threeByteChar, 'utf8').length
    expect(length).toBe(3)
  })
  it('should be a four byte character', () => {
    const length = Buffer.from(fourByteChar, 'utf8').length
    expect(length).toBe(4)
  })
})

describe('A CharBuffer', () => {
  let buffer
  beforeEach(() => {
    buffer = new CharBuffer()
  })

  it('should throw if pushing a null chunk', () => {
    expect(() => buffer.push(null)).toThrow(
      'Cannot push null or undefined chunk into CharBuffer.')
  })
  it('should toString return an empty string when empty', () => {
    expect(buffer.toString()).toBe('')
  })

  describe('and another CharBuffer', () => {
    let otherBuffer
    beforeEach(() => {
      otherBuffer = new CharBuffer()
    })
    it('should throw when comparing their "begin" pointers', () => {
      expect(() => buffer.begin().compareTo(otherBuffer.begin())).toThrow(
        'Cannot compare pointers from different CharBuffers.')
    })
  })
  describe('"begin" pointer', () => {
    let begin
    beforeEach(() => {
      begin = buffer.begin()
    })
    it('should be a CharPointer', () => {
      expect(begin).toBeInstanceOf(CharPointer)
    })
    it('should be a new poitner for each request', () => {
      expect(begin).not.toBe(buffer.begin())
    })
    it('should toString equal an empty string', () => {
      expect(begin.toString()).toBe('')
    })

    it('should compare equal to itself', () => {
      expect(begin.compareTo(begin)).toBe(0)
    })
    it('should fail trying to advance', () => {
      expect(begin.advance()).toBe(false)
    })
    it('should fail to rewind', () => {
      expect(begin.rewind()).toBe(false)
    })
    describe('when tested', () => {
      it('should return false for an empty string', () => {
        expect(begin.test('')).toBe(false)
      })
      it('should return false for a byte', () => {
        const byte = 0x61 // 'a'
        expect(begin.test(byte)).toBe(false)
      })
      it('should return false for a string', () => {
        const str = 'a'
        expect(begin.test(str)).toBe(false)
      })
      it('should return false for a buffer', () => {
        const buf = Buffer.from('a', 'utf8')
        expect(begin.test(buf)).toBe(false)
      })
      it('should throw if test is not a byte, string, or buffer', () => {
        expect(() => begin.test({})).toThrow(
          'Value must be a byte, string, or buffer.')
      })
    })    
    describe('and "end" pointer', () => {
      let end
      beforeEach(() => {
        end = buffer.end()
      })
      it('should be a CharPointer', () => {
        expect(end).toBeInstanceOf(CharPointer)
      })
      it('should be a new poitner for each request', () => {
        expect(end).not.toBe(buffer.end())
      })
      it('should toString equal an empty string', () => {
        expect(end.toString()).toBe('')
      })
      it('should compare equal', () => {
        expect(begin.compareTo(end)).toBe(0)
        expect(end.compareTo(begin)).toBe(0)
      })
    })
  })
  describe('after pushing an empty buffer', () => {
    beforeEach(() => {
      buffer.push(Buffer.from([]))
    })
    it('should have "begin" and "end" compare equal.', () => {
      const begin = buffer.begin()
      const end = buffer.end()
      expect(begin.compareTo(end)).toBe(0)
      expect(end.compareTo(begin)).toBe(0)
    })
  })
  describe('after pushing a buffer with a single invalid byte', () => {
    beforeEach(() => {
      buffer.push(Buffer.from([INVALID_UTF8_BYTE]))
    })
    it('should throw when toString is called', () => {
      expect(() => buffer.toString()).toThrow('Invalid UTF-8 start byte.')
    })
  })

  describe.each([
    2, 3, 4
  ])('consuming part of a %i byte character', (byteCount) => {
    const char = multiByteChars[byteCount - 1]
    const charBuffer = Buffer.from(char, 'utf8')
    const bytesInChar = charBuffer.length

    describe.each([
      ...range(1, bytesInChar - 1)
    ])('split into %i buffers', (splitCount) => {
      let chunks
      beforeEach(() => {
        chunks = []
      })

      describe.each([...[
        ...starsAndBars(byteCount - 1, splitCount - 1, { minStars: 1 }),
        ].map(o => [o])
      ])('distributed as %j', (bytesPerChunk) => {
        beforeEach(() => {
          for(let i = 0, j = 0; i < splitCount; i++) {
            const bytesInChunk = bytesPerChunk[i]
            const chunk = charBuffer.slice(j, j + bytesInChunk)
            chunks.push(chunk)
            j += bytesInChunk
          }
          for (const chunk of chunks) {
            buffer.push(chunk)
          }        
        })
        describe('then its pointer "end"', () => {
          let end
          beforeEach(() => {
            end = buffer.end()
          })
          it('should toString equal to the empty string', () => {
            expect(end.toString()).toBe('')
          })
        })
        describe('then its pointer "begin"', () => {
          let pointer
          beforeEach(() => {
            pointer = buffer.begin()
          })
          it('should toString equal to the empty string', () => {
            expect(pointer.toString()).toBe('')
          })
          it('should test false for the character', () => {
            expect(pointer.test(char)).toBe(false)
          })
          describe('when advanced', () => {
            let result
            beforeEach(() => {
              result = pointer.advance()
            })
            it('should return false', () => {
              expect(result).toBe(false)
            })
            it('should not change the pointer', () => {
              expect(pointer.toString()).toBe('')
            })
            it('should compare equal to "end"', () => {
              const end = buffer.end()
              expect(pointer.compareTo(end)).toBe(0)
              expect(end.compareTo(pointer)).toBe(0)
            })
            it('should compare equal to "begin"', () => {
              const begin = buffer.begin()
              expect(pointer.compareTo(begin)).toBe(0)
              expect(begin.compareTo(pointer)).toBe(0)
            })
          })
        })
      })
    })
  })

  describe.each([
    1, 2, 3, 4
  ])('consuming a %i byte character', (byteCount) => {
    const char = multiByteChars[byteCount - 1]
    const charBuffer = Buffer.from(char, 'utf8')
    const bytesInChar = charBuffer.length

    describe.each([
      ...range(1, bytesInChar)
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
            const chunk = charBuffer.slice(j, j + bytesInChunk)
            chunks.push(chunk)
            j += bytesInChunk
          }
          for (const chunk of chunks) {
            buffer.push(chunk)
          }        
        })
        it('should toString equal the character', () => {
          expect(buffer.toString()).toBe(char)
        })
        describe('then its pointer "begin"', () => {
          let begin
          beforeEach(() => {
            begin = buffer.begin()
          })
          describe('when cloned', () => {
            let clone
            beforeEach(() => {
              clone = begin.clone()
            })
            it('should be a new pointer', () => {
              expect(clone).not.toBe(begin)
            })
            it('should compare equal to "begin"', () => {
              expect(clone.compareTo(begin)).toBe(0)
              expect(begin.compareTo(clone)).toBe(0)
            })
          })
          it('should toString equal the character', () => {
            expect(begin.toString()).toBe(char)
          })
          describe('testing for the character', () => {
            describe('as a byte', () => {
              it('should return true if bytes in char is one', () => {
                const byte = charBuffer[0]
                expect(begin.test(byte)).toBe(bytesInChar == 1)
              })
            })
            describe('as a string', () => {
              it('should return true', () => {
                expect(begin.test(char)).toBe(true)
              })
              it('should return false if another char is tested', () => {
                const notChar = 'x'
                expect(begin.test(notChar)).toBe(false)
              })
            })
            describe('as a buffer', () => {
              it('should return true', () => {
                expect(begin.test(charBuffer)).toBe(true)
              })
              it('should return false if another char is tested', () => {
                const notCharBuffer = Buffer.from('x', 'utf8')
                expect(begin.test(notCharBuffer)).toBe(false)
              })
            })
            describe('as a member of IFS', () => {
              it('should return true', () => {
                const ifs = '$' + char + '!'
                expect(begin.test(ifs)).toBe(true)
              })
              it('should return false when not a member of IFS', () => {
                const ifs = '$' + char + '!'
                const notMember = ifs.replace(char, 'x')
                expect(begin.test(notMember)).toBe(false)
              })
            })
          })
          describe('and pointer "end"', () => {
          let end
            beforeEach(() => {
              end = buffer.end()
            })
            describe('when cloned', () => {
              let clone
              beforeEach(() => {
                clone = end.clone()
              })
              it('should be a new pointer', () => {
                expect(clone).not.toBe(end)
              })
              it('should compare equal to "end"', () => {
                expect(clone.compareTo(end)).toBe(0)
                expect(end.compareTo(clone)).toBe(0)
              })
            })
            it('should be different objects', () => {
              expect(begin).not.toBeEquals(end)
            })
            it('should compare "end" greater than "begin"', () => {
              expect(end.compareTo(begin)).toBe(1)
              expect(begin.compareTo(end)).toBe(-1)
            })
            it('should toString "begin" to "end" equal the character', () => {
              expect(begin.toString(end)).toBe(char)
            })      
            it('should throw when toString "end" to "begin"', () => {
              expect(() => end.toString(begin)).toThrow(
                'End pointer is before the start pointer.')
            })
            describe('when "begin" is advanced', () => {
              let result
              beforeEach(() => {
                result = begin.advance()
              })
              it('should successfully advance "begin"', () => {
                expect(result).toBe(true)
              })
              it('should compare equal to "end"', () => {
                expect(begin.compareTo(end)).toBe(0)
                expect(end.compareTo(begin)).toBe(0)
              })
            })   
            describe('when "end" is rewound', () => {
              let result
              beforeEach(() => {
                result = end.rewind()
              })
              it('should succssfully rewind "end"', () => {
                expect(result).toBe(true)
              })
              it('should compare equal to "begin"', () => {
                expect(begin.compareTo(end)).toBe(0)
                expect(end.compareTo(begin)).toBe(0)
              })
            })
          })
        })
      })
    })

    describe('and another 1 byte character', () => {
      const otherChar = 'z'
      const otherByteCount = Buffer.from(otherChar, 'utf8').length
      const otherCharBuffer = Buffer.from(otherChar, 'utf8')

      describe.each([
        ...range(1, bytesInChar)
      ])('split into %i buffers', (splitCount) => {
        let chunks
        beforeEach(() => {
          chunks = []
        })

        describe.each([...[
          ...starsAndBars(byteCount + otherByteCount, splitCount - 1, { minStars: 1 }),
          ].map(o => [o])
        ])('distributed as %j', (bytesPerChunk) => {
          beforeEach(() => {
            const concatBuffer = Buffer.concat([charBuffer, otherCharBuffer])
            for(let i = 0, j = 0; i < splitCount; i++) {
              const bytesInChunk = bytesPerChunk[i]
              const chunk = concatBuffer.slice(j, j + bytesInChunk)
              chunks.push(chunk)
              j += bytesInChunk
            }
            for (const chunk of chunks) {
              buffer.push(chunk)
            }        
          })
          it('should toString equal the character and the other character', () => {
            expect(buffer.toString()).toBe(char + otherChar)
          })
          describe('then assigns a pointer from "begin"', () => {
            let pointer
            beforeEach(() => {
              pointer = buffer.begin()
            })
            it('should test positive for the character', () => {
              expect(pointer.test(char)).toBe(true)
            })
            it('should test negative for the other character', () => {
              expect(pointer.test(otherChar)).toBe(false)
            })
            it('should toString equal the character and the other character', () => {
              expect(pointer.toString()).toBe(char + otherChar)
            })
            describe('when advanced', () => {
              let result
              beforeEach(() => {
                result = pointer.advance()
              })
              it('should successfully advance "begin"', () => {
                expect(result).toBe(true)
              })
              it('should test negative for the character', () => {
                expect(pointer.test(char)).toBe(false)
              })
              it('should test positive for the other character', () => {
                expect(pointer.test(otherChar)).toBe(true)
              })
              it('should compare less than "end"', () => {
                const end = buffer.end()
                expect(pointer.compareTo(end)).toBe(-1)
                expect(end.compareTo(pointer)).toBe(1)
              })
              it('should toString with begin to equal the character', () => {
                const begin = buffer.begin()
                expect(begin.toString(pointer)).toBe(char)
              })
              it('should toString equal the other character', () => {
                expect(pointer.toString()).toBe(otherChar)
              })
              describe('and advanced again', () => {
                beforeEach(() => {
                  result = pointer.advance()
                })
                it('should successfully advance "begin" again', () => {
                  expect(result).toBe(true)
                })
                it('should compare equal than "end"', () => {
                  const end = buffer.end()
                  expect(pointer.compareTo(end)).toBe(0)
                  expect(end.compareTo(pointer)).toBe(0)
                })
              })
            })
          })
        })
      })
    
      describe('and preceeded by a 1 byte character', () => {
        const preceedingChar = 'a'
        const preceedingByteCount = Buffer.from(preceedingChar, 'utf8').length
        const preceedingCharBuffer = Buffer.from(preceedingChar, 'utf8')

        describe.each([
          ...range(1, bytesInChar)
        ])('split into %i buffers', (splitCount) => {
          let chunks
          beforeEach(() => {
            chunks = []
          })

          describe.each([...[
            ...starsAndBars(
              byteCount + otherByteCount + preceedingByteCount, 
              splitCount - 1, { minStars: 1 }),
            ].map(o => [o])
          ])('distributed as %j', (bytesPerChunk) => {
            const chars = [
              preceedingCharBuffer, charBuffer, otherCharBuffer]
            const concatChars = chars.join('')
            const concatBuffer = Buffer.concat(chars)
            beforeEach(() => {
              for(let i = 0, j = 0; i < splitCount; i++) {
                const bytesInChunk = bytesPerChunk[i]
                const chunk = concatBuffer.slice(j, j + bytesInChunk)
                chunks.push(chunk)
                j += bytesInChunk
              }
              for (const chunk of chunks) {
                buffer.push(chunk)
              }        
            })
            describe.each([
              0, 1, 2
            ])('starting at %i', (startAt) => {
              describe.each([
                ...range(startAt + 1, 3)
              ])('and ending at %i', (endAt) => {
                let begin, end
                beforeEach(() => {
                  begin = buffer.begin()
                  end = buffer.begin()
                  repeat(startAt, () => begin.advance())
                  repeat(endAt, () => end.advance())
                })
                it('should toString the substring between "begin" and "end"', () => {
                  const actual = begin.toString(end)
                  const expected = unicodeSlice(concatChars, startAt, endAt)
                  expect(actual).toBe(expected)
                })
                it('should compare "begin" before "end"', () => {
                  expect(begin.compareTo(end)).toBe(-1)
                })
                it('should compare "end" after "begin"', () => {
                  expect(end.compareTo(begin)).toBe(1)
                })
              })
            })
          })
        })
      })
    })
  })
})

function unicodeSlice(str, start, end) {
  return Array.from(str).slice(start, end).join('')
}

function repeat(count, callback) {
  for (let i = 0; i < count; i++)
    callback(i)
}

function* range(start, end) {
  if (start > end) return
  for (let i = start; i <= end; i++)
    yield i
}

