import { describe, it, expect, beforeEach } from 'vitest'
import { 
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  OffsetReadableCursorConcept,
  OffsetWritableCursorConcept,
  ContiguousCursorConcept,
} from './cursor-concepts.js'

import {
  TrivialInputRange,
  TrivialOutputRange,
  TrivialMutableRange,
  TrivialForwardRanged,
  TrivialBidirectionalRange,
  TrivialRandomAccessRange,
  TrivialOffsetReadableRange,
  TrivialOffsetWritableRange,
  TrivialOffsetRange,
  TrivialContiguousRange,
  TrivialOtherRange,
} from './trivial-cursors.js'

import {
  ForwardList,
  List,
  ArrayMap,
  Deque,
} from '@kingjs/cursor-container'
import { SnapshotView } from '@kingjs/cursor-view'

const input = [
  InputCursorConcept,
]

const output = [
  OutputCursorConcept,
]

const mutable = [
  InputCursorConcept,
  OutputCursorConcept,
]

const forward = [
  ...mutable,
  ForwardCursorConcept,
]

const bidirectional = [
  ...forward,
  BidirectionalCursorConcept,
]

const randomAccess = [
  ...bidirectional,
  RandomAccessCursorConcept,
]

const offsetReadable = [
  ...randomAccess,
  OffsetReadableCursorConcept,
]

const offsetWritable = [
  ...randomAccess,
  OffsetWritableCursorConcept,
]

const offset = [
  ...randomAccess,
  OffsetReadableCursorConcept,
  OffsetWritableCursorConcept,
]

const contiguous = [
  ...offset,
  ContiguousCursorConcept,
]

const Tests = {
  TrivialInputCursor: {
    type: TrivialInputRange,
    concepts: input,
  },
  TrivialOutputCursor: {
    type: TrivialOutputRange,
    concepts: output,
  },
  TrivialMutableCursor: {
    type: TrivialMutableRange,
    concepts: mutable,
  },
  TrivialForwardCursor: {
    type: TrivialForwardRanged,
    concepts: forward,
  },
  TrivialBidirectionalCursor: {
    type: TrivialBidirectionalRange,
    concepts: bidirectional,
  },
  TrivialRandomAccessCursor: {
    type: TrivialRandomAccessRange,
    concepts: randomAccess,
  },
  TrivialOffsetReadableCursor: {
    type: TrivialOffsetReadableRange,
    concepts: offsetReadable,
  },
  TrivialOffsetWritableCursor: {
    type: TrivialOffsetWritableRange,
    concepts: offsetWritable,
  },
  TrivialOffsetCursor: {
    type: TrivialOffsetRange,
    concepts: offset,
  },
  TrivialContiguousCursor: {
    type: TrivialContiguousRange,
    concepts: contiguous,
  },
  ForwardList: {
    type: ForwardList,
    concepts: forward,
  },
  List: {
    type: List,
    concepts: bidirectional,
  },
  ArrayMap: {
    type: ArrayMap,
    concepts: offset,
  },
  Deque: {
    type: Deque,
    concepts: offset,
  },
  Snapshot: {
    type: SnapshotView,
    create: () => new SnapshotView([]),
    concepts: [
      InputCursorConcept,
      ForwardCursorConcept,
      BidirectionalCursorConcept,
      RandomAccessCursorConcept,
      OffsetReadableCursorConcept,
    ],
  },
}

function has(concepts, concept) {
  return concepts.includes(concept)
}

describe.each(Object.entries(Tests))('%s', (_, { 
  type, 
  create = () => new type(), 
  concepts, 
  bufferType,
}) => {
  let cursorType, cursorPrototype

  beforeEach(() => {
    cursorType = type.cursorType
    cursorPrototype = cursorType.prototype
  })

  describe('type', () => {
    it('satisfies CursorConcept', () => {
      expect(cursorPrototype).toBeInstanceOf(CursorConcept)
    })

    it('satisfies expected concepts', () => {
      for (const concept of concepts)
        expect(cursorPrototype).toBeInstanceOf(concept)
    })

    it('creates an empty iterable range', () => {
      const container = create()
      expect([...container]).toEqual([])
    })
  })

  describe('when empty', () => {
    let container
    let begin

    beforeEach(() => {
      container = create()
      begin = container.begin()
    })

    describe('cursor', () => {
      it('is instanceof cursor type', () => {
        expect(begin).toBeInstanceOf(cursorType)
      })

      it('rejects step', () => {
        expect(() => begin.step()).toThrow(
          'Cannot move cursor out of bounds.')
      })

      it('is equatable to itself', () => {
        expect(begin.equatableTo(begin)).toBe(true)
      })

      it('is not equatable to null', () => {
        expect(begin.equatableTo(null)).toBe(false)
      })

      it('equals itself', () => {
        expect(begin.equals(begin)).toBe(true)
      })

      it('is not equal to null', () => {
        expect(begin.equals(null)).toBe(false)
      })
    })

    if (has(concepts, InputCursorConcept)) {
      describe('as an input cursor', () => {
        it('is instanceof InputCursorConcept', () => {
          expect(begin).toBeInstanceOf(InputCursorConcept)
        })

        it('rejects value read', () => {
          expect(() => begin.value).toThrow(
            'Cannot read value out of bounds of cursor.')
        })
      })
    }
  
    if (has(concepts, OutputCursorConcept)) {
      describe('as an output cursor', () => {
        it('is instanceof OutputCursorConcept', () => {
          expect(begin).toBeInstanceOf(OutputCursorConcept)
        })

        it('rejects value write', () => {
          expect(() => begin.value = 42).toThrow(
            'Cannot write value out of bounds of cursor.')
        })
      })
    }
  
    if (has(concepts, ForwardCursorConcept)) {
      describe('as a forward cursor', () => {
        it('is instanceof ForwardCursorConcept', () => {
          expect(begin).toBeInstanceOf(ForwardCursorConcept)
        })

        it('equals its clone', () => {
          expect(begin.equals(begin.clone())).toBe(true)
        })
      })
    }
  
    if (has(concepts, BidirectionalCursorConcept)) {
      describe('as a bidirectional cursor', () => {
        it('is instanceof BidirectionalCursorConcept', () => {
          expect(begin).toBeInstanceOf(BidirectionalCursorConcept)
        })

        it('rejects stepBack', () => {
          expect(() => {
            begin.stepBack()
            begin.stepBack()
          }).toThrow('Cannot move cursor out of bounds.')
        })
      })
    }
  
    if (has(concepts, RandomAccessCursorConcept)) {
      describe('as a random access cursor', () => {
        it('is instanceof RandomAccessCursorConcept', () => {
          expect(begin).toBeInstanceOf(RandomAccessCursorConcept)
        })

        it('rejects moving forward', () => {
          expect(() => begin.move(1)).toThrow(
            'Cannot move cursor out of bounds.')
        })

        it('rejects moving backward', () => {
          expect(() => begin.move(-1)).toThrow(
            'Cannot move cursor out of bounds.')
        })

        it('accepts moving zero', () => {
          expect(begin.move(0)).toBe(begin)
        })

        it('reports zero distance to itself', () => {
          expect(begin.distanceTo(begin)).toBe(0)
        })

        it('rejects distance to null', () => {
          expect(() => begin.distanceTo(null)).toThrow(
            'Cursor is from another container.')
        })

        it('compares equal to itself', () => {
          expect(begin.compareTo(begin)).toBe(0)
        })

        it('rejects comparison to null', () => {
          expect(() => begin.compareTo(null)).toThrow(
            'Cursor is from another container.')
        })
      })
    }

    if (has(concepts, OffsetReadableCursorConcept)) {
      describe('as an offset readable cursor', () => {
        it('is instanceof OffsetReadableCursorConcept', () => {
          expect(begin).toBeInstanceOf(OffsetReadableCursorConcept)
        })

        it('rejects at zero by precondition', () => {
          expect(() => begin.at(0)).toThrow(
            'Cannot read value out of bounds of cursor.')
        })
      })
    }

    if (has(concepts, OffsetWritableCursorConcept)) {
      describe('as an offset writable cursor', () => {
        it('is instanceof OffsetWritableCursorConcept', () => {
          expect(begin).toBeInstanceOf(OffsetWritableCursorConcept)
        })

        it('rejects setAt zero by precondition', () => {
          expect(() => begin.setAt(0, 42)).toThrow(
            'Cannot write value out of bounds of cursor.')
        })
      })
    }
    
    if (has(concepts, ContiguousCursorConcept)) {
      describe('as a contiguous cursor', () => {
        it('is instanceof ContiguousCursorConcept', () => {
          expect(begin).toBeInstanceOf(ContiguousCursorConcept)
        })

        it('returns an empty span', () => {
          const buffer = begin.span()
          expect(buffer).toBeInstanceOf(Uint8Array)
          expect(buffer.byteLength).toBe(0)
        })

        it('returns the expected span type', () => {
          const buffer = begin.span()
          expect(buffer instanceof (bufferType || Uint8Array)).toBe(true)
        })

        it('rejects span with null cursor', () => {
          expect(() => begin.span(null)).toThrow(
            'Cursor is from another container.')
        })
      })
    }

    describe('and another cursor', () => {
      let otherBegin

      beforeEach(() => {
        otherBegin = container.begin()
      })

      it('is equal', () => {
        expect(begin.equals(otherBegin)).toBe(true)
      })

      it('is equatable', () => {
        expect(begin.equatableTo(otherBegin)).toBe(true)
      })

      if (has(concepts, RandomAccessCursorConcept)) {
        describe('as a random access cursor', () => {
          it('compares equal', () => {
            expect(begin.compareTo(otherBegin)).toBe(0)
          })

          it('reports zero distance', () => {
            expect(begin.distanceTo(otherBegin)).toBe(0)
          })
        })
      }

      if (has(concepts, ContiguousCursorConcept)) {
        describe('span', () => {
          it('returns an empty span', () => {
            const buffer = begin.span(otherBegin)
            expect(buffer).toBeInstanceOf(Uint8Array)
            expect(buffer.byteLength).toBe(0)
          })

          it('returns the expected span type', () => {
            const buffer = begin.span(otherBegin)
            expect(buffer instanceof (bufferType || Uint8Array)).toBe(true)
          })
        })
      }
    })
    
    describe('and another cursor from a different container', () => {
      let otherBegin

      beforeEach(() => {
        otherBegin = create().begin()
      })

      it('is not equatable', () => {
        expect(begin.equatableTo(otherBegin)).toBe(false)
      })

      it('is not equal', () => {
        expect(begin.equals(otherBegin)).toBe(false)
      })
    })
  
    describe('and another cursor from a different type of container', () => {
      let otherCursor

      beforeEach(() => {
        otherCursor = new TrivialOtherRange().begin()
      })

      it('is not equatable', () => {
        expect(begin.equatableTo(otherCursor)).toBe(false)
      })

      it('is not equal', () => {
        expect(begin.equals(otherCursor)).toBe(false)
      })

      if (has(concepts, RandomAccessCursorConcept)) {
        describe('as a random access cursor', () => {
          it('rejects distance to other cursor', () => {
            expect(() => begin.distanceTo(otherCursor)).toThrow(
              'Cursor is from another container.')
          })

          it('rejects comparison to other cursor', () => {
            expect(() => begin.compareTo(otherCursor)).toThrow(
              'Cursor is from another container.')
          })
        })
      }

      if (has(concepts, ContiguousCursorConcept)) {
        describe('as a contiguous cursor', () => {
          it('rejects span with other cursor', () => {
            expect(() => begin.span(otherCursor)).toThrow(
              'Cursor is from another container.')
          })
        })
      }
    })
  })
})
