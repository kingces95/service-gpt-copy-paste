import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import {
  Concept,
} from '@kingjs/partial-concept'
import {
  ContainerPart,
  IndexableContainerPart,
  BackInsertableContainerPart,
  FrontInsertableContainerPart,
  EditableContainerPart,
  SizedContainerPart,
  CapacityContainerPart,
  ReservableContainerPart,
  ByteContainerPart,
  ClearableContainerPart,
  BulkAssignableContainerPart,
  PhasedBulkContainerPart,
  BulkEditableContainerPart,
  AssociativeContainerPart,
  SetAssociativeContainerPart,
  MapAssociativeContainerPart,
} from '@kingjs/cursor-container'
import {
  RangeProbe,
  ReadableRangeProbe,
  WritableRangeProbe,
  ForwardRangeProbe,
  BidirectionalRangeProbe,
  RandomAccessRangeProbe,
  ContiguousRangeProbe,
  RangeShape,
} from '@kingjs/cursor-shape'
import {
  BacktrackableCursorPart,
  CursorPart,
  ComparableToCursorPart,
  MovableCursorPart,
  RangeConcept,
  ReadableAtCursorPart,
  ReadableCursorPart,
  SpannableCursorPart,
  SteppableCursorPart,
  WritableAtCursorPart,
  WritableCursorPart,
} from '@kingjs/cursor'

import {
  ForwardList,
  List,
  ArrayMap,
  Deque,
  // NodeBuffer,
  // EcmaBuffer,
  UnorderedMap,
  UnorderedSet,
  Uint8Vector, Uint16Vector, Uint32Vector, Float64Vector,
} from '@kingjs/cursor-container'
import { value } from '@kingjs/abstract'
import { next } from '@kingjs/cursor-algorithm'
import { single } from '@kingjs/cursor-adapter'
import { populateContainer } from './test/create-container.js'

const universalContainerConcepts = [
  RangeConcept,
  ContainerPart]

const universalRangeProbes = [
  RangeProbe,
  ReadableRangeProbe]

const sequenceContainerConcepts = [
  ...universalContainerConcepts]

const sequenceRangeProbes = [
  ...universalRangeProbes,
  ForwardRangeProbe,
  WritableRangeProbe]

const reversibleContainerConcepts = [
  ...sequenceContainerConcepts,
  FrontInsertableContainerPart,
  BackInsertableContainerPart]

const reversibleRangeProbes = [
  ...sequenceRangeProbes,
  BidirectionalRangeProbe]

const indexableContainerConcepts = [
  ...reversibleContainerConcepts,
  IndexableContainerPart,
  BackInsertableContainerPart,
  SizedContainerPart]

const indexableRangeProbes = [
  ...reversibleRangeProbes,
  RandomAccessRangeProbe]

const bufferConainerConcepts = [
  ...indexableContainerConcepts,
  EditableContainerPart,
  CapacityContainerPart,
  ReservableContainerPart,
  ByteContainerPart]

const bufferRangeProbes = [
  ...indexableRangeProbes,
  ContiguousRangeProbe]

const associativeContainerConcepts = [
  ...universalContainerConcepts,
  AssociativeContainerPart]

const associativeRangeProbes = universalRangeProbes

const Value = 42
const Key = 'key'
const IsEmpty = 'Argument this must be NotEmpty.'
const NotAtEnd = 'Argument this must be NotAtEnd.'
const ReadOutOfBounds = 'Cannot read value out of bounds of cursor.'
const WriteOutOfBounds = 'Cannot write value out of bounds of cursor.'
const CursorOutOfBounds = 'Cannot move cursor out of bounds.'
const UpdateOutOfBounds = 'Cannot update container at this location.'

// STL names can collide across sequence and associative containers. The
// requires/excludes metadata disambiguates shared names like insert/erase.
const PopulateOne = {
  Key: {
    insert: { requires: ['contains'] },
    insertOrAssign: { requires: ['contains'] },
  },
  Value: {
    pushFront: {},
    pushBack: {},
  },
  CursorValue: {
    insertValue: { cursor: 'begin', acceptsEnd: true },
    insertValueAfter: { cursor: 'beforeBegin' },
  },
  CursorRange: {
    insertRange: { cursor: 'begin' },
    insertRangeAfter: { cursor: 'beforeBegin' },
  },
  Range: {
    assignRange: {},
  },
  CursorCountValue: {
    insert: { cursor: 'begin', excludes: ['contains'] },
    insertAfter: { cursor: 'beforeBegin' },
  },
  CountValue: {
    assign: {},
  },
  SizeValue: {
    resize: {},
  },
}

const DepopulateOne = {
  NoArgs: {
    popBack: { returns: 'value' },
    popFront: { returns: 'value' },
    clear: {},
  },
  Cursor: {
    eraseAfter: { cursor: 'beforeBegin', returns: 'end' },
    erase: { cursor: 'begin', returns: 'end', excludes: ['contains'] },
  },
  CursorRange: {
    eraseAfter: {
      first: 'beforeBegin',
      last: cursor => next(cursor, 2),
      returns: 'end',
    },
    erase: {
      first: 'begin',
      last: cursor => next(cursor),
      returns: 'end',
      excludes: ['contains'],
    },
  },
  Key: {
    erase: { requires: ['contains'] },
  },
  SizeValue: {
    resize: { size: 0 },
  },
}

const SourceRangeMembers = {
  Range: {
    assignRange: {},
  },
  CursorRange: {
    insertRange: { cursor: 'begin' },
    insertRangeAfter: { cursor: 'beforeBegin' },
  },
  CursorRangeRange: {
    replaceRange: { first: 'begin', last: 'begin' },
    replaceRangeAfter: { first: 'beforeBegin', last: 'beforeBegin' },
  },
}

const ReplaceRangeMembers = {
  CursorRangeRange: {
    replaceRange: { first: 'begin', last: cursor => next(cursor) },
    replaceRangeAfter: { first: 'beforeBegin', last: cursor => next(cursor, 2) },
  },
}

// Flatten grouped metadata to the members supported by a container while
// preserving the group name as `kind` metadata.
//
// supportedCases({
//   Range: { assignRange: {} },
//   Value: { pushBack: {} },
// }, { pushBack: true })
//
// returns [['pushBack', { kind: 'Value' }]]
function supportedCases(groups, members) {
  return Object.entries(groups)
    .flatMap(([kind, tests]) => Object.entries(tests)
      .filter(([member, metadata]) => {
        if (!members[member]) return false
        if (metadata.requires?.some(member => !members[member])) return false
        if (metadata.excludes?.some(member => members[member])) return false
        return true
      })
      .map(([member, metadata]) => [
        member,
        { kind, ...metadata }
      ]))
}

function sourceRangeArgs(container, range, { kind, cursor, first, last }) {
  if (kind == 'Range')
    return [range]

  if (kind == 'CursorRange')
    return [container[cursor](), range]

  if (kind == 'CursorRangeRange')
    return [container[first](), container[last](), range]
}

function replaceRangeArgs(container, range, { first, last }) {
  return [container[first](), last(container[first]()), range]
}

const Tests = {
  UnorderedMap: {
    type: UnorderedMap,
    cursorType: UnorderedMap.cursorType,
    concepts: [
      ClearableContainerPart,
      MapAssociativeContainerPart,
      ...associativeContainerConcepts],
    probes: associativeRangeProbes,
    members: {
      size: true,
      contains: true, erase: true,
      at: true, insertOrAssign: true,
      clear: true,
    },
    value: [Key, Value],
    nextValue: [Key + 1, Value + 1],
    keyOf: ([key]) => key,
    mappedOf: ([, value]) => value,
  },

  UnorderedSet: {
    type: UnorderedSet,
    cursorType: UnorderedSet.cursorType,
    concepts: [
      ClearableContainerPart,
      SetAssociativeContainerPart,
      ...associativeContainerConcepts],
    probes: associativeRangeProbes,
    members: {
      size: true,
      contains: true, erase: true,
      insert: true,
      clear: true,
    },
  },

  ForwardList: {
    type: ForwardList,
    cursorType: ForwardList.cursorType,
    concepts: [
      ClearableContainerPart,
      BulkAssignableContainerPart,
      PhasedBulkContainerPart,
      ...sequenceContainerConcepts,
      FrontInsertableContainerPart],
    probes: sequenceRangeProbes,
    members: {
      popFront: true, pushFront: true,
      beforeBegin: true, insertValueAfter: true, eraseAfter: true,
      clear: true,
      resize: true,
      assignRange: true,
      assign: true,
      insertRangeAfter: true,
      insertAfter: true,
      replaceRangeAfter: true,
    }
  },

  List: {
    type: List,
    cursorType: List.cursorType,
    concepts: [
      ...reversibleContainerConcepts,
      ClearableContainerPart,
      BulkAssignableContainerPart,
      SizedContainerPart],
    probes: reversibleRangeProbes,
    members: {
      beforeBegin: true, insertValueAfter: true, eraseAfter: true,
      size: true,
      clear: true,
      popFront: true, pushFront: true,
      popBack: true, pushBack: true,
      stepBack: true,
      insertValue: true,
      erase: true,
      resize: true,
      assignRange: true,
      assign: true,
      insertRangeAfter: true,
      insertAfter: true,
      replaceRangeAfter: true,
    }
  },

  Deque: {
    type: Deque,
    cursorType: Deque.cursorType,
    concepts: [
      ClearableContainerPart,
      BulkAssignableContainerPart,
      BulkEditableContainerPart,
      ...indexableContainerConcepts],
    probes: indexableRangeProbes,
    members: {
      size: true,
      popFront: true, pushFront: true,
      popBack: true, pushBack: true,
      stepBack: true,
      at: true, setAt: true,
      insertValue: true, erase: true,
      clear: true,

      // BulkAssignableContainerPart members
      resize: true,
      assignRange: true,
      assign: true,

      // BulkEditableContainerPart members
      insertRange: true,
      insert: true,
      replaceRange: true,
    }
  },

  ArrayMap: {
    type: ArrayMap,
    cursorType: ArrayMap.cursorType,
    concepts: [
      ClearableContainerPart,
      EditableContainerPart,
      BulkAssignableContainerPart,
      BulkEditableContainerPart,
      ...indexableContainerConcepts],
    probes: indexableRangeProbes,
    members: {
      size: true,
      popFront: true, pushFront: true,
      popBack: true, pushBack: true,
      stepBack: true,
      at: true, setAt: true,
      insertValue: true, erase: true,
      clear: true,

      // BulkAssignableContainerPart members
      resize: true,
      assignRange: true,
      assign: true,

      // BulkEditableContainerPart members
      insertRange: true,
      insert: true,
      replaceRange: true,
    }
  },

  Uint8Vector: {
    type: Uint8Vector,
    cursorType: Uint8Vector.cursorType,
    concepts: [
      BulkAssignableContainerPart,
      BulkEditableContainerPart,
      ...bufferConainerConcepts],
    probes: bufferRangeProbes,
    members: {
      size: true,
      popFront: true, pushFront: true,
      popBack: true, pushBack: true,
      stepBack: true,
      at: true, setAt: true, // readAt: true,
      insertValue: true, erase: true,
      capacity: true, reserve: true,
      span: true,
      clear: true,

      // BulkAssignableContainerPart members
      resize: true,
      assignRange: true,
      assign: true,

      // BulkEditableContainerPart members
      insertRange: true,
      insert: true,
      replaceRange: true,
    }
  },
}

describe.each(Object.entries(Tests))('A %s', (name, {
  type,
  cursorType,
  concepts,
  probes,
  members,
  value = Value,
  nextValue = Value + 1,
  keyOf = value => value,
  mappedOf = value => value,
  rangeOf = single,
}) => {

  let container
  let otherContainer
  beforeEach(() => {
    container = new type()
    otherContainer = new type()
  })

  // Some STL names are shared across container categories. Derive those
  // semantics from the public part surface rather than neighboring members.
  const hasIndexedAt = type.prototype instanceof IndexableContainerPart
  const hasKeyedAt = type.prototype instanceof MapAssociativeContainerPart
  const cursorPart = type.cursorType.prototype
  const isCursorPart = cursorPart instanceof CursorPart
  const isSteppableCursorPart = cursorPart instanceof SteppableCursorPart
  const isReadableCursorPart = cursorPart instanceof ReadableCursorPart
  const isWritableCursorPart = cursorPart instanceof WritableCursorPart
  const isBacktrackableCursorPart =
    cursorPart instanceof BacktrackableCursorPart
  const isMovableCursorPart = cursorPart instanceof MovableCursorPart
  const isComparableToCursorPart = cursorPart instanceof ComparableToCursorPart
  const isReadableAtCursorPart = cursorPart instanceof ReadableAtCursorPart
  const isWritableAtCursorPart = cursorPart instanceof WritableAtCursorPart
  const isSpannableCursorPart = cursorPart instanceof SpannableCursorPart

  function withCount(size) {
    it('have equal begin cursors', () => {
      const begin1 = container.begin()
      const begin2 = container.begin()
      expect(begin1.equals(begin2)).toBe(true)
    })
    it('have equal end cursors', () => {
      const end1 = container.end()
      const end2 = container.end()
      expect(end1.equals(end2)).toBe(true)
    })
    it(size == 0 ? 'have begin equal to end' : 'have begin distinct from end', () => {
      const begin = container.begin()
      const end = container.end()
      expect(begin.equals(end)).toBe(size == 0)
    })
    if (members.size) it(`report size ${size}`, () => {
      expect(container.size).toBe(size)
    })
    if (members.capacity) it(`have capacity greater than ${size}`, () => {
      expect(container.capacity).toBeGreaterThan(size)
    })
    if (members.span) it(`have span length ${size}`, () => {
      expect(container.span().length).toBe(size)
    })
  }

  function emptyState() {
    it('be empty', () => {
      expect(container.isEmpty).toBe(true)
    })
    withCount(0)
  }

  describe('type should', () => {
    it('implement its expected concepts', () => {
      for (const concept of concepts) {
        if (type.prototype instanceof concept == false) throw new Error(
          `${type.name} does not implement ${concept.name}.`)
        expect(type.prototype instanceof concept).toBe(true)
      }
    })
    it('implement only its expected concepts', () => {
      const set = new Set(concepts)
      const baseConcepts = [...PartialReflect.baseTypes(type)]
        .filter(current => PartialReflect.isExtensionOf(current, Concept))
      for (const concept of baseConcepts) {
        if (set.has(concept) == false) throw new Error(
          `${type.name} implements unexpected concept ${concept.name}.`)
        expect(set.has(concept)).toBe(true)
      }
    })
    it('satisfy its expected range probes', () => {
      expect(type.prototype).toBeInstanceOf(RangeShape)

      for (const probe of probes)
        expect(type.prototype).toBeInstanceOf(probe)
    })
    it('define its expected members', () => {
      for (const member of Reflect.ownKeys(members)) {
        expect(member in type.prototype)
      }
    })
    it('expose its expected cursor type', () => {
      expect(type.cursorType).toBe(cursorType)
      expect(container.cursorType).toBe(cursorType)
    })
  })

  describe('should', () => {
    describe('when empty', () => {
      it('have cursors distinct from another container', () => {
        const begin1 = container.begin()
        const begin2 = otherContainer.begin()
        expect(begin1.equals(begin2)).toBe(false)
      })
      if (members.copy) it('accept a null copy', () => {
        const begin = container.begin()
        const end = container.end()
        container.copy(begin, begin, end)
      })
      if (members.span) it('have a Uint8Array span', () => {
        expect(container.span()).toBeInstanceOf(Uint8Array)
      })
      emptyState()
    })

    if (members.reserve) {
      describe('manage capacity', () => {
        let capacity
        beforeEach(() => {
          capacity = container.capacity
        })
        it('keep capacity when reserving current capacity', () => {
          expect(container.reserve(capacity)).toBe(capacity)
        })
        it('double capacity when reserving one more capacity', () => {
          const newCapacity = container.reserve(capacity + 1)
          expect(newCapacity).toBe(capacity * 2)
        })
      })
    }

    describe('when populated with', () => {
      describe.each(supportedCases(PopulateOne, members))(
        '%s', (fn, { kind, cursor: cursorFn }) => {

        beforeEach(() => {
          if (kind == 'Range') {
            container[fn](rangeOf(value))
          }
          else if (kind == 'CursorRange') {
            container[fn](container[cursorFn](), rangeOf(value))
          }
          else if (kind == 'CountValue') {
            container[fn](1, value)
          }
          else if (kind == 'CursorCountValue') {
            container[fn](container[cursorFn](), 1, value)
          }
          else if (kind == 'SizeValue') {
            container[fn](1, value)
          }
          else if (kind == 'Key') {
            if (members.insertOrAssign)
              container[fn](keyOf(value), mappedOf(value))
            else
              container[fn](keyOf(value))
          }
          else if (kind == 'CursorValue') {
            container[fn](container[cursorFn](), value)
          }
          else if (kind == 'Value') {
            container[fn](value)
          }
        })
        withCount(1)

        if (kind == 'SizeValue') {
          it('keep existing values when resizing to current size', () => {
            container[fn](1, value + 1)

            expect(container.begin().value).toBe(value)
          })
        }

        it('not be empty', () => {
          expect(container.isEmpty).toBe(false)
        })

        if (hasIndexedAt) it('have value at index 0', () => {
          expect(container.at(0)).toBe(value)
        })
        if (members.setAt) it('set value at index 0', () => {
          container.setAt(0, value + 1)
          expect(container.at(0)).toBe(value + 1)
        })
        if (members.readAt) it('read value at index 0', () => {
          expect(container.readAt(0)).toBe(value)
        })
        if (members.span) it('have span matching the value', () => {
          expect(container.span()[0]).toBe(value)
        })
        if (members.contains) it('contain the key', () => {
          expect(container.contains(keyOf(value))).toBe(true)
        })
        if (hasKeyedAt) it('get the value by key', () => {
          expect(container.at(keyOf(value))).toBe(mappedOf(value))
        })
      })
    })

    const replaceRangeCases = supportedCases(ReplaceRangeMembers, members)
      .filter(([, { kind }]) => kind == 'CursorRangeRange')

    if (replaceRangeCases.length) {
      describe('when replacing a range with', () => {
        describe.each(replaceRangeCases)('%s', (fn, metadata) => {

          it('replace the existing value', () => {
            populateContainer(container, [value])
            container[fn](...replaceRangeArgs(
              container, rangeOf(nextValue), metadata))

            expect(container.begin().value).toStrictEqual(nextValue)
          })
        })
      })
    }

    describe('when depopulated with', () => {
      describe.each(supportedCases(DepopulateOne, members))(
        '%s', (fn, {
          kind,
          cursor: cursorFn,
          first,
          last,
          size,
          returns,
        }) => {

        let result
        let cursor
        beforeEach(() => {
          populateContainer(container, [value])

          if (kind == 'Cursor') {
            cursor = container[cursorFn]()
            result = container[fn](cursor)
          }
          else if (kind == 'CursorRange') {
            cursor = container[first]()
            result = container[fn](cursor, last(cursor))
          }
          else if (kind == 'SizeValue') {
            result = container[fn](size, value)
          }
          else if (kind == 'Key') {
            result = container[fn](keyOf(value))
          }
          else if (kind == 'NoArgs') {
            result = container[fn]()
          }
        })

        if (returns == 'value') {
          it('return the value', () => {
            expect(result).toBe(value)
          })
        }
        if (returns == 'end') {
          it('not return the original cursor', () => {
            expect(result).not.toBe(cursor)
          })
          it('return end', () => {
            const end = container.end()
            expect(result.equals(end)).toBe(true)
          })
        }

        emptyState()
      })
    })
  })

  if (isSteppableCursorPart || isWritableCursorPart || isComparableToCursorPart) {
    describe('should implement cursor', () => {
      if (isSteppableCursorPart) {
        describe('step', () => {
          it('move to next value', () => {
            populateContainer(container, [value, nextValue])
            const begin = container.begin()

            begin.step()

            expect(begin.value).toStrictEqual(nextValue)
          })
        })
      }

      if (isWritableCursorPart) {
        describe('value set', () => {
          it('update current value', () => {
            populateContainer(container, [value])
            const begin = container.begin()

            begin.value = nextValue

            expect(begin.value).toStrictEqual(nextValue)
          })
        })
      }

      if (isComparableToCursorPart) {
        describe('compareTo', () => {
          beforeEach(() => {
            populateContainer(container, [value, nextValue])
          })

          it('return -1 when before another cursor', () => {
            const first = container.begin()
            const second = first.clone().step()
            expect(first.compareTo(second)).toBe(-1)
          })

          it('return 0 when equal to another cursor', () => {
            const first = container.begin()
            const same = first.clone()
            expect(first.compareTo(same)).toBe(0)
          })

          it('return 1 when after another cursor', () => {
            const first = container.begin()
            const second = first.clone().step()
            expect(second.compareTo(first)).toBe(1)
          })
        })
      }
    })
  }

  describe('should specialize', () => {
    if (isCursorPart) {
      describe('CursorPart', () => {
        it('isAtEnd$', () => {
          expect(container.begin().isAtEnd$).toBe(true)
        })
      })
    }

    if (isSteppableCursorPart) {
      describe('SteppableCursorPart', () => {
        it('canStep$', () => {
          expect(container.begin().canStep$()).toBe(false)
        })
      })
    }

    if (isReadableCursorPart) {
      describe('ReadableCursorPart', () => {
        it('isReadable$', () => {
          expect(container.begin().isReadable$()).toBe(false)
        })
      })
    }

    if (isWritableCursorPart) {
      describe('WritableCursorPart', () => {
        it('isWritable$', () => {
          expect(container.begin().isWritable$()).toBe(false)
        })
      })
    }

    if (isBacktrackableCursorPart) {
      describe('BacktrackableCursorPart', () => {
        it('isAtBegin$', () => {
          const begin = members.beforeBegin
            ? container.beforeBegin()
            : container.begin()
          expect(begin.isAtBegin$()).toBe(true)
        })
        it('canStepBack$', () => {
          const begin = members.beforeBegin
            ? container.beforeBegin()
            : container.begin()
          expect(begin.canStepBack$()).toBe(false)
        })
      })
    }

    if (isMovableCursorPart) {
      describe('MovableCursorPart', () => {
        it('canMove$', () => {
          const begin = container.begin()
          expect(begin.canMove$(0)).toBe(true)
          expect(begin.canMove$(1)).toBe(false)
          expect(begin.canMove$(-1)).toBe(false)
        })
      })
    }

    if (isReadableAtCursorPart) {
      describe('ReadableAtCursorPart', () => {
        it('isReadableAt$', () => {
          expect(container.begin().isReadableAt$(0)).toBe(false)
        })
      })
    }

    if (isWritableAtCursorPart) {
      describe('WritableAtCursorPart', () => {
        it('isWritableAt$', () => {
          expect(container.begin().isWritableAt$(0)).toBe(false)
        })
      })
    }

    if (isSpannableCursorPart) {
      describe('SpannableCursorPart', () => {
        it('canSpan$', () => {
          const begin = container.begin()
          const otherBegin = otherContainer.begin()
          expect(begin.canSpan$()).toBe(true)
          expect(begin.canSpan$(otherBegin)).toBe(false)
        })
      })
    }
  })

  const sourceRangeCases = supportedCases(SourceRangeMembers, members)
  const cursorValueCases = supportedCases(PopulateOne, members)
    .filter(([, { kind }]) => kind == 'CursorValue')
  const cursorRangeCases = supportedCases(DepopulateOne, members)
    .filter(([, { kind }]) => kind == 'CursorRange')

  describe('asserts', () => {
    describe('when empty then calls', () => {
      it('step', () => {
        const begin = container.begin()
        expect(() => { begin.step() }).toThrow(NotAtEnd)
      })

      if (members.stepBack) it('stepBack before begin', () => {
        const begin = members.beforeBegin
          ? container.beforeBegin()
          : container.begin()
        expect(() => { begin.stepBack() }).toThrow(CursorOutOfBounds)
      })

      if (members.popFront) it('popFront', () => {
        expect(() => { container.popFront() }).toThrow(IsEmpty)
      })
      if (hasIndexedAt) it('at', () => {
        expect(() => { container.at(0) }).toThrow(ReadOutOfBounds)
      })
      if (members.setAt) it('setAt', () => {
        expect(() => { container.setAt(0, 42) }).toThrow(WriteOutOfBounds)
      })
      if (members.readAt) it('readAt', () => {
        expect(() => { container.readAt(0) }).toThrow(
          'Cannot read 1 byte(s) at index 1.')
      })
    })

    if (sourceRangeCases.length) {
      const sourceOverlapCases = [
        ...sourceRangeCases.filter(([, { kind }]) => kind != 'CursorRangeRange'),
        ...supportedCases(ReplaceRangeMembers, members),
      ]

      describe('when a non-source range is passed to', () => {
        it.each(sourceRangeCases)('%s', (fn, metadata) => {
          const badRange = { }
          const args = sourceRangeArgs(container, badRange, metadata)
          const index = args.indexOf(badRange)

          expect(() => { container[fn](...args) }).toThrow(
            `Argument ${index} must be RangeConcept.`)
        })
      })

      describe('when its own range is passed to', () => {
        it.each(sourceOverlapCases)('%s', (fn, metadata) => {
          populateContainer(container, [value])
          const args = metadata.kind == 'CursorRangeRange'
            ? replaceRangeArgs(container, container, metadata)
            : sourceRangeArgs(container, container, metadata)

          expect(() => { container[fn](...args) }).not.toThrow()
          expect(container.isEmpty).toBe(false)
        })
      })
    }

    if (cursorValueCases.length) {
      describe.each(cursorValueCases)('when %s receives', (
        fn,
        { acceptsEnd }) => {

        it('a null cursor', () => {
          expect(() => { container[fn](null, value) }).toThrow()
        })
        it('a cursor from another container', () => {
          const otherCursor = otherContainer.begin()
          expect(() => { container[fn](otherCursor, value) }).toThrow()
        })
        if (!acceptsEnd) it('an out-of-bounds cursor', () => {
          const endCursor = container.end()
          expect(() => { container[fn](endCursor, value) }).toThrow()
        })
      })
    }

    if (cursorRangeCases.length) {
      describe.each(cursorRangeCases)('when %s receives', (
        fn,
        { first }) => {

        it('a null last cursor', () => {
          populateContainer(container, [value])
          const cursor = container[first]()
          expect(() => { container[fn](cursor, null) }).toThrow(TypeError)
        })
      })
    }

    if (hasIndexedAt && members.erase) {
      describe('when erase receives', () => {
        it('a reversed cursor pair', () => {
          populateContainer(container, [value])

          expect(() => {
            container.erase(container.end(), container.begin())
          }).toThrow(UpdateOutOfBounds)
        })
      })
    }
  })
})
