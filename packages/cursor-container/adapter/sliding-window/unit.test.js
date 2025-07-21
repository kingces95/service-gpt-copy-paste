import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'

import { distance, advance } from '@kingjs/cursor'
import { ObjectSlidingWindow } from '@kingjs/object-sliding-window'
import { ByteSlidingWindow } from '@kingjs/byte-sliding-window'
import { 
  TrimmedSlidingWindow,
  CodeUnitSlidingWindow,
  CodePointSlidingWindow,
  Utf8SlidingWindow,
  Utf16SlidingWindow,
  Utf32SlidingWindow,
} from '@kingjs/unicode-sliding-window'

class TrivialTrimmedSlidingWindow extends TrimmedSlidingWindow {
  constructor() { super(new ObjectSlidingWindow()) }
  next$(innerCursor) { 
    const result = innerCursor.value 
    innerCursor.step() // advance to the next item
    return result
  }
  step$(innerCursor) { return innerCursor.step() }
  stepBack$(innerCursor) { return innerCursor.stepBack() }
  trim$(innerCursor) { /* noop */ }
}

class TrivialCodePointSlidingWindow extends CodePointSlidingWindow {
  decodeLength$(codeUnit) { return 1 }
  decodeValue$(cursor) { 
    const result = cursor.value 
    cursor.step() // advance to the next code unit
    return result
  }
}

const WindowType = {
  ObjectSlidingWindow,
  ByteSlidingWindow,
  TrivialTrimmedSlidingWindow,
  CodeUnitSlidingWindow,
  TrivialCodePointSlidingWindow,
  Utf8SlidingWindow,
  Utf16SlidingWindow,
  Utf32SlidingWindow,
}

function BufferFromUtf32LE(str) {
  const buf = Buffer.alloc(str.length * 4)
  let offset = 0

  for (const codePoint of str) {
    const cp = codePoint.codePointAt(0)
    buf.writeUInt32BE(cp, offset)
    offset += 4
  }

  return buf
}

const Values = [
  { id: 0 },
  { id: 1 }, { id: 2 },
  { id: 3 }, { id: 4 }, { id: 5 },
]

describe.each([ 
  ['ObjectSlidingWindow', { 
    badPushError: 'Chunk must be an object or an array.',
    values: Values,
    chunks: [
      [],
      [Values[0]], 
      [Values[1], Values[2]],
      [Values[3], Values[4], Values[5]],
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start, end),
  }],
  ['ByteSlidingWindow', { 
    badPushError: 'Chunk must be a Buffer.',
    values: ['0', '1', '2', '3', '4'].map(c => c.charCodeAt(0)),
    chunks: [
      Buffer.from([]),
      Buffer.from('0'),
      Buffer.from('12'),
      Buffer.from('345'),
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start, end),
  }],
  ['TrivialTrimmedSlidingWindow', {
    badPushError: 'Chunk must be an object or an array.',
    values: Values,
    chunks: [
      [],
      [Values[0]], 
      [Values[1], Values[2]],
      [Values[3], Values[4], Values[5]],
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start, end),
  }],
  ['CodeUnitSlidingWindow', {
    badPushError: 'Chunk must be a Buffer.',
    values: ['0', '1', '2', '3', '4'].map(c => c.charCodeAt(0)),
    chunks: [
      Buffer.from([]),
      Buffer.from('0'),
      Buffer.from('12'),
      Buffer.from('345'),
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start, end),
  }],
  ['TrivialCodePointSlidingWindow', {
    badPushError: 'Chunk must be a Buffer.',
    values: ['0', '1', '2', '3', '4'].map(c => c.charCodeAt(0)),
    chunks: [
      Buffer.from([]),
      Buffer.from('0'),
      Buffer.from('12'),
      Buffer.from('345'),
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start, end),
  }],
  ['Utf8SlidingWindow', {
    badPushError: 'Chunk must be a Buffer.',
    values: ['0', '1', '2', '3', '4'].map(c => c.charCodeAt(0)),
    chunks: [
      Buffer.from([]),
      Buffer.from('0'),
      Buffer.from('12'),
      Buffer.from('345'),
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start, end),
  }],
  ['Utf16SlidingWindow', {
    activation: [ { littleEndian: true } ],
    badPushError: 'Chunk must be a Buffer.',
    values: ['0', '1', '2', '3', '4'].map(c => c.charCodeAt(0)),
    chunks: [
      Buffer.from([]),
      Buffer.from('0', 'utf16le'),
      Buffer.from('12', 'utf16le'),
      Buffer.from('345', 'utf16le'),
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start * 2, end * 2),
  }],
  ['Utf32SlidingWindow', {
    badPushError: 'Chunk must be a Buffer.',
    values: ['0', '1', '2', '3', '4'].map(c => c.charCodeAt(0)),
    chunks: [
      Buffer.from([]),
      BufferFromUtf32LE('0', 'utf32le'),
      BufferFromUtf32LE('12', 'utf32le'),
      BufferFromUtf32LE('345', 'utf32le'),
    ],
    sliceChunk: (buffer, start, end) => buffer.slice(start * 4, end * 4),
  }],
])('A %s', 
  (name, { 
    badPushError, 
    chunks,
    values,
    sliceChunk,
    activation = [], 
  }) => {
  let window
  const chunk0 = chunks[0]
  const chunk1 = chunks[1]
  const chunk2 = chunks[2]
  const chunk3 = chunks[3]
  const value0 = values[0]
  const value1 = values[1]
  const value2 = values[2]
  beforeEach(() => {
    window = new WindowType[name](...activation)
  })
  it('should be empty.', () => {
    expect(window.isEmpty).toBe(true)
  })
  it('should shift an empty array.', () => {
    expect(window.shift()).toEqual([])
  })
  it('should throw if pushing null attempted.', () => {
    expect(() => window.push(null)).toThrow(
      "Cannot push null to a SlidingWindow.")
  })
  it('should throw if pushing undefined attempted.', () => {
    expect(() => window.push(undefined)).toThrow(
      "Cannot push undefined to a SlidingWindow.")
  })
  it('should throw if pushing a symbol attempted.', () => {
    expect(() => window.push(Symbol())).toThrow(badPushError)
  })
  describe('then disposed', () => {
    let result
    beforeEach(() => {
      result = window.dispose()
    })
    it('should return an empty array.', () => {
      expect(result).toEqual([])
    })
    it('should throw if disposed again.', () => {
      expect(() => window.dispose()).toThrow(
        'Container has been disposed.')
    })
    it('should throw on begin cursor.', () => {
      expect(() => window.begin()).toThrow(
        'Container has been disposed.')
    })
    it('should throw on end cursor.', () => {
      expect(() => window.end()).toThrow(
        'Container has been disposed.')
    })
    it('should throw on push.', () => {
      expect(() => window.push(chunk0)).toThrow(
        'Container has been disposed.')
    })
    it('should throw on shift.', () => {
      expect(() => window.shift()).toThrow(
        'Container has been disposed.')
    })
  })
  describe('and another window is created', () => {
    let other
    beforeEach(() => {
      other = new WindowType[name](...activation)
    })
    it('should not have equal begin cursors.', () => {
      expect(window.begin().equals(other.begin)).toBe(false)
    })
  })      
  describe('begin cursor', () => {
    let begin
    beforeEach(() => {
      begin = window.begin()
    })
    it('should be at the beginning.', () => {
      expect(begin.isBegin).toBe(true)
    })
    it('should be at the end.', () => {
      expect(begin.isEnd).toBe(true)
    })
    it('should return an undefined value.', () => {
      // to be undefined, not null, as the window is empty.
      expect(begin.value).toBe(undefined)
    })
    it('should next and undefined value.', () => {
      expect(begin.next()).toBe(undefined)
    })
    it('should not step.', () => {
      expect(begin.step()).toBe(false)
    })
    it('should not step back.', () => {
      expect(begin.stepBack()).toBe(false)
    })
    describe('then disposing the window', () => {
      let result
      beforeEach(() => {
        result = window.dispose()
      })
      it('should throw on step.', () => {
        expect(() => begin.step()).toThrow(
          'Container has been popped since cursor was created.')
      })
    })
    describe('after cloning', () => {
      let clone
      beforeEach(() => {
        clone = begin.clone()
      })
      it('should be equal to the original.', () => {
        expect(clone.isBegin).toBe(true)
      })
      it('should not be the original.', () => {
        expect(clone).not.toBe(begin)
      })
      it('should be at the beginning.', () => {
        expect(clone.isBegin).toBe(true)
      })
      it('should be at the end.', () => {
        expect(clone.isEnd).toBe(true)
      })
      it('should return an undefined value.', () => {
        expect(clone.value).toBe(undefined)
      })
      it('should not step.', () => {
        expect(clone.step()).toBe(false)
      })
      it('should not step back.', () => {
        expect(clone.stepBack()).toBe(false)
      })
    })
  })
  describe('end cursor', () => {
    let current
    beforeEach(() => {
      current = window.end()
    })
    it('should be equal to the begin cursor.', () => {
      expect(current.equals(window.begin())).toBe(true)
    })
    it('should not be the begin cursor.', () => {
      expect(current).not.toBe(window.begin())
    })
    it('should be at the beginning.', () => {
      expect(current.isBegin).toBe(true)
    })
    it('should be at the end.', () => {
      expect(current.isEnd).toBe(true)
    })
    it('should return an undefined value.', () => {
      expect(current.value).toBe(undefined)
    })
    it('should not step.', () => {
      expect(current.step()).toBe(false)
    })
    it('should not step back.', () => {
      expect(current.stepBack()).toBe(false)
    })
    describe('after pushing a chunk with one item', () => {
      beforeEach(() => {
        window.push(chunk1)
      })
      it('should not be at the end.', () => {
        expect(current.isEnd).toBe(false)
      })
      it('should return the value.', () => {
        // end cursor is not invalidated by pushing but rather will now
        // return the value of the first item of the chunk pushed.
        expect(current.value).toBe(value0)
      })
    })
  })
  describe('after pushing a chunk with one item', () => {
    beforeEach(() => {
      window.push(chunk1)
    })
    it('should have not be empty.', () => {
      expect(window.isEmpty).toBe(false)
    })
    describe('then popping', () => {
      beforeEach(() => {
        window.shift()
      })
      it('should be empty.', () => {
        expect(window.isEmpty).toBe(true)
      })
    })
    describe('begin cursor', () => {
      let current
      beforeEach(() => {
        current = window.begin()
      })
      it('should be at the beginning.', () => {
        expect(current.isBegin).toBe(true)
      })
      it('should not be at the end.', () => {
        expect(current.isEnd).toBe(false)
      })
      it('should return the value.', () => {
        expect(current.value).toBe(value0)
      })
      it('should step.', () => {
        expect(current.step()).toBe(true)
      })
      it('should not step back.', () => {
        expect(current.stepBack()).toBe(false)
      })
      describe('then iterating with next', () => {
        let value
        beforeEach(() => {
          value = current.next()
        })
        it('should return the value.', () => {
          expect(value).toBe(value0)
        })
        it('should be at the end.', () => {
          expect(current.isEnd).toBe(true)
        })
      })
      describe('and end cursor', () => {
        let end
        beforeEach(() => {
          end = window.end()
        })
        it('should be be separated by a distance of 1.', () => {
          expect(distance(current, end)).toBe(1)
        })
        it('should be unequal to the begin cursor.', () => {
          expect(current.equals(end)).toBe(false)
        })
      })
      describe('cloned', () => {
        let clone
        beforeEach(() => {
          clone = current.clone()
        })
        it('should be equal to the original.', () => {
          expect(clone.equals(current)).toBe(true)
        })
        it('should not be the original.', () => {
          expect(clone).not.toBe(current)
        })
        it('should be at the beginning.', () => {
          expect(clone.isBegin).toBe(true)
        })
        it('should not be at the end.', () => {
          expect(clone.isEnd).toBe(false)
        })
        it('should return the value.', () => {
          expect(clone.value).toBe(value0)
        })
        it('should step.', () => {
          expect(clone.step()).toBe(true)
        })
        it('should not step back.', () => {
          expect(clone.stepBack()).toBe(false)
        })
      })
      describe('stepped forward', () => {
        beforeEach(() => {
          current.step()
        })
        it('should be at the end.', () => {
          expect(current.isEnd).toBe(true)
        })
        it('should not be at the beginning.', () => {
          expect(current.isBegin).toBe(false)
        })
        it('return an undefined value.', () => {
          expect(current.value).toBe(undefined)
        })
        it('should not step.', () => {
          expect(current.step()).toBe(false)
        })
        it('should step back.', () => {
          expect(current.stepBack()).toBe(true)
        })
        it('should be equal to the end cursor.', () => {
          expect(current.equals(window.end())).toBe(true)
        })
        describe('after stepping back', () => {
          beforeEach(() => {
            current.stepBack()
          })
          it('should be at the beginning.', () => {
            expect(current.isBegin).toBe(true)
          })
          it('should not be at the end.', () => {
            expect(current.isEnd).toBe(false)
          })
          it('should return the value.', () => {
            expect(current.value).toBe(value0)
          })
        })
      })
      describe('after popping', () => {
        let result
        beforeEach(() => {
          result = window.shift()
        })
        it('should return an array with the chunk.', () => {
          expect(result).toEqual([chunk1].flat())
        })
        it('should not be active.', () => {
          expect(current.__isActive).toBe(false)
        })
        it('should throw when asked for a value.', () => {
          expect(() => current.value).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when trying to next.', () => {
          expect(() => current.next()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when trying to step.', () => {
          expect(() => current.step()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when trying to step back.', () => {
          expect(() => current.stepBack()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw testing equality.', () => {
          expect(() => current.equals(current)).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw when cloning.', () => {
          expect(() => current.clone()).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw testing isBegin.', () => {
          expect(() => current.isBegin).toThrow(
            'Container has been popped since cursor was created.')
        })
        it('should throw testing isEnd.', () => {
          expect(() => current.isEnd).toThrow(
            'Container has been popped since cursor was created.')
        })
        describe('recycled begin cursor', () => {
          beforeEach(() => {
            current = window.begin(current)
          })
          it('should be the original.', () => {
            expect(current).toBe(current)
          })
          it('should be active.', () => {
            expect(current.__isActive).toBe(true)
          })
          it('should be at the beginning.', () => {
            expect(current.isBegin).toBe(true)
          })
          it('should return an undefined value.', () => {
            expect(current.value).toBe(undefined)
          })
        })
        describe('new begin cursor', () => {
          let begin2
          beforeEach(() => {
            begin2 = window.begin()
          })
          it('should be different from the original.', () => {
            expect(begin2).not.toBe(current)
          })
          it('should be at the beginning.', () => {
            expect(begin2.isBegin).toBe(true)
          })
          it('should be at the end.', () => {
            expect(begin2.isEnd).toBe(true)
          })
          it('should return an undefined value.', () => {
            expect(begin2.value).toBe(undefined)
          })
          it('should not step.', () => {
            expect(begin2.step()).toBe(false)
          })
          it('should not step back.', () => {
            expect(begin2.stepBack()).toBe(false)
          })
        })
      })
    })
    describe('and the next chunk with two items', () => {
      const nextChunk = chunk2
      beforeEach(() => {
        window.push(nextChunk)
      })
      it('should have distance of three from begin to end.', () => {
        const begin = window.begin()
        const end = window.end()
        expect(distance(begin, end)).toBe(3)
      })
      describe('then disposed', () => {
        let result
        beforeEach(() => {
          result = window.dispose()
        })
        it('should return all elements in an array.', () => {
          expect(result).toEqual([chunk1, nextChunk].flat())
        })
      })
      describe('shifting two elements', () => {
        let shiftedFirstAndSecond
        beforeEach(() => {
          const cursor = advance(window.begin(), 2)
          shiftedFirstAndSecond = window.shift(cursor)
        })
        it('should return an array with the first two items.', () => {
          const expected = [chunk1, sliceChunk(nextChunk, 0, 1)]
          expect(shiftedFirstAndSecond).toEqual(expected.flat())
        })
        it('should have distance of 1.', () => {
          expect(distance(window.begin(), window.end())).toBe(1)
        })
        describe('begin cursor', () => {
          let begin
          beforeEach(() => {
            begin = window.begin()
          })
          it('should be at the beginning.', () => {
            expect(begin.isBegin).toBe(true)
          })
          it('should not be at the end.', () => {
            expect(begin.isEnd).toBe(false)
          })
          it('should point at the second value of the second chunk.', () => {
            expect(begin.value).toBe(value2)
          })
        })
        describe('end cursor', () => {
          let end
          beforeEach(() => {
            end = window.end()
          })
          it('should be at the end.', () => {
            expect(end.isEnd).toBe(true)
          })
          it('should not be at the beginning.', () => {
            expect(end.isBegin).toBe(false)
          })
          it('should return undefined.', () => {
            expect(end.value).toBe(undefined)
          })
        })
        describe('then shifting nothing', () => {
          let shiftedNothing
          beforeEach(() => {
            const begin = window.begin()
            shiftedNothing = window.shift(begin)
          })
          it('should return an empty array.', () => {
            expect(shiftedNothing).toEqual([])
          })
          it('should not be empty.', () => {
            expect(window.isEmpty).toBe(false)
          })
          it('should have distance of 1.', () => {
            expect(distance(window.begin(), window.end())).toBe(1)
          })
        })
        describe('then shifting the rest', () => {
          let shiftedThird
          beforeEach(() => {
            shiftedThird = window.shift()
          })
          it('should return an array with the rest of the items.', () => {
            const expected = [sliceChunk(nextChunk, 1, 2)]
            expect(shiftedThird).toEqual(expected.flat())
          })
          it('should be empty.', () => {
            expect(window.isEmpty).toBe(true)
          })
        })
      })
    })
  })
})