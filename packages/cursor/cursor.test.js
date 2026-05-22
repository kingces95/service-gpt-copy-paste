import { describe, it, expect, beforeEach } from 'vitest'
import { iterate } from '@kingjs/cursor-algorithm'

// Concepts are C#-ish declarations; shapes are STL-ish category probes.

// Capabilities under test.
import {
  BacktrackableCursorConcept,
  CloneableCursorConcept,
  ComparableToCursorConcept,
  CursorConcept,
  MeasurableCursorConcept,
  MovableCursorConcept,
  ReadableAtCursorConcept,
  ReadableCursorConcept,
  SpannableCursorConcept,
  SteppableCursorConcept,
  WritableAtCursorConcept,
  WritableCursorConcept,
} from '@kingjs/cursor'

// Structural classifiers under test.
import {
  BidirectionalCursorShape,
  ContiguousCursorShape,
  CursorShape,
  ForwardCursorShape,
  InputCursorShape,
  OutputCursorShape,
  RandomAccessCursorShape,
  WritableRandomAccessCursorShape,
} from '@kingjs/cursor-shape'

// Fixture ranges.
import {
  // Part fixture ranges.
  TrivialBacktrackableRange,
  TrivialCloneableRange,
  TrivialComparableToRange,
  TrivialMeasurableRange,
  TrivialMovableRange,
  TrivialReadableAtRange,
  TrivialReadableRange,
  TrivialSpannableRange,
  TrivialSteppableRange,
  TrivialWritableAtRange,
  TrivialWritableRange,

  // Shape/category fixture ranges.
  TrivialInputRange,
  TrivialOutputRange,
  TrivialForwardRange,
  TrivialBidirectionalRange,
  TrivialRandomAccessRange,
  TrivialWritableRandomAccessRange,
  TrivialContiguousRange,

  // Other fixture range.
  TrivialOtherRange,
} from './trivial-cursors.js'

// Real ranges.
import {
  ForwardList,
  List,
  ArrayMap,
  Deque,
} from '@kingjs/cursor-container'
import { SnapshotView } from '@kingjs/cursor-view'

const ConceptTests = {
  TrivialSteppableCursor: {
    type: TrivialSteppableRange,
    capabilities: [
      SteppableCursorConcept,
    ],
    shapes: [],
  },
  TrivialReadableCursor: {
    type: TrivialReadableRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
    ],
  },
  TrivialWritableCursor: {
    type: TrivialWritableRange,
    capabilities: [
      SteppableCursorConcept,
      WritableCursorConcept,
    ],
    shapes: [
      OutputCursorShape,
    ],
  },
  TrivialCloneableCursor: {
    type: TrivialCloneableRange,
    capabilities: [
      SteppableCursorConcept,
      CloneableCursorConcept,
    ],
    shapes: [],
  },
  TrivialBacktrackableCursor: {
    type: TrivialBacktrackableRange,
    capabilities: [
      SteppableCursorConcept,
      BacktrackableCursorConcept,
    ],
    shapes: [],
  },
  TrivialMovableCursor: {
    type: TrivialMovableRange,
    capabilities: [
      SteppableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
    ],
    shapes: [],
  },
  TrivialComparableToCursor: {
    type: TrivialComparableToRange,
    capabilities: [
      SteppableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
    ],
    shapes: [],
  },
  TrivialMeasurableCursor: {
    type: TrivialMeasurableRange,
    capabilities: [
      SteppableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      MeasurableCursorConcept,
    ],
    shapes: [],
  },
  TrivialReadableAtCursor: {
    type: TrivialReadableAtRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ReadableAtCursorConcept,
    ],
    shapes: [],
  },
  TrivialWritableAtCursor: {
    type: TrivialWritableAtRange,
    capabilities: [
      SteppableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      WritableAtCursorConcept,
    ],
    shapes: [],
  },
  TrivialSpannableCursor: {
    type: TrivialSpannableRange,
    capabilities: [
      SteppableCursorConcept,
      CloneableCursorConcept,
      SpannableCursorConcept,
    ],
    shapes: [],
  },
}

const ShapeTests = {
  TrivialInputCursor: {
    type: TrivialInputRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
    ],
  },
  TrivialOutputCursor: {
    type: TrivialOutputRange,
    capabilities: [
      SteppableCursorConcept,
      WritableCursorConcept,
    ],
    shapes: [
      OutputCursorShape,
    ],
  },
  TrivialForwardCursor: {
    type: TrivialForwardRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
    ],
  },
  TrivialBidirectionalCursor: {
    type: TrivialBidirectionalRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
    ],
  },
  TrivialRandomAccessCursor: {
    type: TrivialRandomAccessRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
      MeasurableCursorConcept,
      ReadableAtCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
      RandomAccessCursorShape,
    ],
  },
  TrivialWritableRandomAccessCursor: {
    type: TrivialWritableRandomAccessRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
      MeasurableCursorConcept,
      ReadableAtCursorConcept,
      WritableAtCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
      RandomAccessCursorShape,
      WritableRandomAccessCursorShape,
    ],
  },
  TrivialContiguousCursor: {
    type: TrivialContiguousRange,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
      MeasurableCursorConcept,
      ReadableAtCursorConcept,
      WritableAtCursorConcept,
      SpannableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
      RandomAccessCursorShape,
      WritableRandomAccessCursorShape,
      ContiguousCursorShape,
    ],
  },
}

const ContainerTests = {
  ForwardList: {
    type: ForwardList,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
    ],
  },
  List: {
    type: List,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
    ],
  },
  ArrayMap: {
    type: ArrayMap,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
      MeasurableCursorConcept,
      ReadableAtCursorConcept,
      WritableAtCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
      RandomAccessCursorShape,
      WritableRandomAccessCursorShape,
    ],
  },
  Deque: {
    type: Deque,
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      WritableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
      MeasurableCursorConcept,
      ReadableAtCursorConcept,
      WritableAtCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      OutputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
      RandomAccessCursorShape,
      WritableRandomAccessCursorShape,
    ],
  },
  Snapshot: {
    type: SnapshotView,
    create: () => new SnapshotView([]),
    capabilities: [
      SteppableCursorConcept,
      ReadableCursorConcept,
      CloneableCursorConcept,
      BacktrackableCursorConcept,
      MovableCursorConcept,
      ComparableToCursorConcept,
      MeasurableCursorConcept,
      ReadableAtCursorConcept,
    ],
    shapes: [
      InputCursorShape,
      ForwardCursorShape,
      BidirectionalCursorShape,
      RandomAccessCursorShape,
    ],
  },
}

const Tests = {
  ...ConceptTests,
  ...ShapeTests,
  ...ContainerTests,
}

function has(concepts, concept) {
  return concepts.includes(concept)
}

function shapesOf(shapes) {
  return [ CursorShape, ...shapes ]
}

describe.each(Object.entries(Tests))('%s', (_, {
  type,
  create = () => new type(),
  capabilities,
  shapes,
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

    it('satisfies expected capabilities', () => {
      for (const capability of capabilities)
        expect(cursorPrototype).toBeInstanceOf(capability)
    })

    it('creates an empty iterable range', () => {
      const container = create()
      expect([...iterate(container)]).toEqual([])
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

      it('satisfies expected cursor shapes', () => {
        for (const shape of shapesOf(shapes))
          expect(begin).toBeInstanceOf(shape)
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

    if (has(capabilities, ReadableCursorConcept)) {
      describe('as an input cursor', () => {
        it('rejects value read', () => {
          expect(() => begin.value).toThrow(
            'Cannot read value out of bounds of cursor.')
        })
      })
    }

    if (has(capabilities, WritableCursorConcept)) {
      describe('as an output cursor', () => {
        it('rejects value write', () => {
          expect(() => begin.value = 42).toThrow(
            'Cannot write value out of bounds of cursor.')
        })
      })
    }

    if (has(capabilities, CloneableCursorConcept)) {
      describe('as a forward cursor', () => {
        it('equals its clone', () => {
          expect(begin.equals(begin.clone())).toBe(true)
        })
      })
    }

    if (has(capabilities, BacktrackableCursorConcept)) {
      describe('as a bidirectional cursor', () => {
        it('rejects stepBack', () => {
          expect(() => {
            begin.stepBack()
            begin.stepBack()
          }).toThrow('Cannot move cursor out of bounds.')
        })
      })
    }

    if (has(capabilities, MovableCursorConcept)) {
      describe('as a random access cursor', () => {
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

        if (has(capabilities, MeasurableCursorConcept)) {
          it('reports zero distance to itself', () => {
            expect(begin.distanceTo(begin)).toBe(0)
          })

          it('rejects distance to null', () => {
            expect(() => begin.distanceTo(null)).toThrow(
              'Cursor is from another container.')
          })
        }

        if (has(capabilities, ComparableToCursorConcept)) {
          it('compares equal to itself', () => {
            expect(begin.compareTo(begin)).toBe(0)
          })

          it('rejects comparison to null', () => {
            expect(() => begin.compareTo(null)).toThrow(
              'Cursor is from another container.')
          })
        }

        if (has(capabilities, ReadableAtCursorConcept)) {
          it('rejects at zero', () => {
            expect(() => begin.at(0)).toThrow(
              'Cannot read value out of bounds of cursor.')
          })
        }
      })
    }

    if (has(capabilities, WritableAtCursorConcept)) {
      describe('as a writable random access cursor', () => {
        it('rejects setAt zero by precondition', () => {
          expect(() => begin.setAt(0, 42)).toThrow(
            'Cannot write value out of bounds of cursor.')
        })
      })
    }

    if (has(capabilities, SpannableCursorConcept)) {
      describe('as a contiguous cursor', () => {
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

      if (has(capabilities, ComparableToCursorConcept) ||
        has(capabilities, MeasurableCursorConcept)) {
        describe('as a random access cursor', () => {
          if (has(capabilities, ComparableToCursorConcept)) {
            it('compares equal', () => {
              expect(begin.compareTo(otherBegin)).toBe(0)
            })
          }

          if (has(capabilities, MeasurableCursorConcept)) {
            it('reports zero distance', () => {
              expect(begin.distanceTo(otherBegin)).toBe(0)
            })
          }
        })
      }

      if (has(capabilities, SpannableCursorConcept)) {
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

      if (has(capabilities, ComparableToCursorConcept) ||
        has(capabilities, MeasurableCursorConcept)) {
        describe('as a random access cursor', () => {
          if (has(capabilities, MeasurableCursorConcept)) {
            it('rejects distance to other cursor', () => {
              expect(() => begin.distanceTo(otherCursor)).toThrow(
                'Cursor is from another container.')
            })
          }

          if (has(capabilities, ComparableToCursorConcept)) {
            it('rejects comparison to other cursor', () => {
              expect(() => begin.compareTo(otherCursor)).toThrow(
                'Cursor is from another container.')
            })
          }
        })
      }

      if (has(capabilities, SpannableCursorConcept)) {
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
