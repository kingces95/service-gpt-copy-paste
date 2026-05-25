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
  RangeConcept,
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
const IsEmpty = 'Container is empty.'
const ReadOutOfBounds = 'Cannot read value out of bounds of cursor.'
const WriteOutOfBounds = 'Cannot write value out of bounds of cursor.'
const CursorOutOfBounds = 'Cannot move cursor out of bounds.'

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
  },
  Range: {
    assignRange: {},
  },
  CursorCountValue: {
    insert: { cursor: 'begin', excludes: ['contains'] },
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

const Tests = {
  UnorderedMap: {
    type: UnorderedMap,
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
  },

  UnorderedSet: {
    type: UnorderedSet,
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
    key: Value,
  },

  ForwardList: {
    type: ForwardList,
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
  type, concepts, probes, members, value = Value, key = Key }) => {

  let container
  let otherContainer
  beforeEach(() => {
    container = new type()
    otherContainer = new type()
  })

  function withCount(size) {
    it('has equal begin cursors', () => {
      const begin1 = container.begin()
      const begin2 = container.begin()
      expect(begin1.equals(begin2)).toBe(true)
    })
    it('has equal end cursors', () => {
      const end1 = container.end()
      const end2 = container.end()
      expect(end1.equals(end2)).toBe(true)
    })
    it(size == 0 ? 'has begin equal to end' : 'has begin distinct from end', () => {
      const begin = container.begin()
      const end = container.end()
      expect(begin.equals(end)).toBe(size == 0)
    })
    if (members.size) it(`reports size ${size}`, () => {
      expect(container.size).toBe(size)
    })
    if (members.capacity) it(`has capacity greater than ${size}`, () => {
      expect(container.capacity).toBeGreaterThan(size)
    })
    if (members.span) it(`has span length ${size}`, () => {
      expect(container.span().length).toBe(size)
    })
  }

  function whenEmpty() {
    it('is empty', () => {
      expect(container.isEmpty).toBe(true)
    })
    if (members.stepBack) it('rejects stepping back before begin', () => {
      const begin = members.beforeBegin
        ? container.beforeBegin()
        : container.begin()
      expect(() => { begin.stepBack() }).toThrow(CursorOutOfBounds)
    })
    if (members.popFront) it('rejects popFront', () => {
      expect(() => { container.popFront() }).toThrow(IsEmpty)
    })
    if (members.at && !members.contains) it('rejects at', () => {
      expect(() => { container.at(0) }).toThrow(ReadOutOfBounds)
    })
    if (members.setAt) it('rejects setAt', () => {
      expect(() => { container.setAt(0, 42) }).toThrow(WriteOutOfBounds)
    })
    if (members.readAt) it('rejects readAt', () => {
      expect(() => { container.readAt(0) }).toThrow(
        'Cannot read 1 byte(s) at index 1.')
    })
    withCount(0)
  }

  describe('type', () => {
    it('implements its expected concepts', () => {
      for (const concept of concepts) {
        if (type.prototype instanceof concept == false) throw new Error(
          `${type.name} does not implement ${concept.name}.`)
        expect(type.prototype instanceof concept).toBe(true)
      }
    })
    it('implements only its expected concepts', () => {
      const set = new Set(concepts)
      const baseConcepts = [...PartialReflect.baseTypes(type)]
        .filter(current => PartialReflect.isExtensionOf(current, Concept))
      for (const concept of baseConcepts) {
        if (set.has(concept) == false) throw new Error(
          `${type.name} implements unexpected concept ${concept.name}.`)
        expect(set.has(concept)).toBe(true)
      }
    })
    it('satisfies its expected range probes', () => {
      expect(type.prototype).toBeInstanceOf(RangeShape)

      for (const probe of probes)
        expect(type.prototype).toBeInstanceOf(probe)
    })
    it('defines its expected members', () => {
      for (const member of Reflect.ownKeys(members)) {
        expect(member in type.prototype)
      }
    })
  })

  describe('when empty', () => {
    it('has cursors distinct from another container', () => {
      const begin1 = container.begin()
      const begin2 = otherContainer.begin()
      expect(begin1.equals(begin2)).toBe(false)
    })
    if (members.copy) it('accepts a null copy', () => {
      const begin = container.begin()
      const end = container.end()
      container.copy(begin, begin, end)
    })
    if (members.span) it('has a Uint8Array span', () => {
      expect(container.span()).toBeInstanceOf(Uint8Array)
    })
    whenEmpty()
  })

  if (members.reserve) {
    describe('Capacity', () => {
      let capacity
      beforeEach(() => {
        capacity = container.capacity
      })
      it('keeps capacity when reserving current capacity', () => {
        expect(container.reserve(capacity)).toBe(capacity)
      })
      it('doubles capacity when reserving one more capacity', () => {
        const newCapacity = container.reserve(capacity + 1)
        expect(newCapacity).toBe(capacity * 2)
      })
    })
  }

  const sourceRangeCases = supportedCases(SourceRangeMembers, members)
  if (sourceRangeCases.length) {
    describe('range arguments', () => {
      describe.each(sourceRangeCases)('%s', (fn, metadata) => {
        it('rejects a non-range source', () => {
          const badRange = {}
          const args = sourceRangeArgs(container, badRange, metadata)

          expect(() => { container[fn](...args) }).toThrow(
            'Argument must be an instance of RangeConcept.')
        })
      })
    })
  }

  describe('when populated with', () => {
    describe.each(supportedCases(PopulateOne, members))(
      '%s', (fn, { kind, cursor: cursorFn, acceptsEnd }) => {

      beforeEach(() => {
        if (kind == 'Range') {
          container[fn](single(value))
        }
        else if (kind == 'CursorRange') {
          container[fn](container[cursorFn](), single(value))
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
            container[fn](value[0], value[1])
          else
            container[fn](key)
        }
        else if (kind == 'CursorValue') {
          container[fn](container[cursorFn](), value)
        }
        else if (kind == 'Value') {
          container[fn](value)
        }
      })
      withCount(1)

      if (kind == 'CursorValue') {
        // test argument checking: null, equatable, end, out of bounds, etc.
        it('rejects a null cursor', () => {
          expect(() => { container[fn](null, value) }).toThrow()
        })
        it('rejects a cursor from another container', () => {
          const otherCursor = otherContainer.begin()
          expect(() => { container[fn](otherCursor, value) }).toThrow()
        })
        if (!acceptsEnd) it('rejects an out-of-bounds cursor', () => {
          const endCursor = container.end()
          expect(() => { container[fn](endCursor, value) }).toThrow()
        })
      }

      it('is not empty', () => {
        expect(container.isEmpty).toBe(false)
      })
      if (members.at && !members.contains) it('has value at index 0', () => {
        expect(container.at(0)).toBe(value)
      })
      if (members.setAt) it('sets value at index 0', () => {
        container.setAt(0, value + 1)
        expect(container.at(0)).toBe(value + 1)
      })
      if (members.readAt) it('reads value at index 0', () => {
        expect(container.readAt(0)).toBe(value)
      })
      if (members.span) it('has span matching the value', () => {
        expect(container.span()[0]).toBe(value)
      })
      if (members.contains) it('contains the key', () => {
        expect(container.contains(key)).toBe(true)
      })
      if (members.at && members.contains) it('gets the value by key', () => {
        expect(container.at(key)).toBe(value[1])
      })
    })
  })

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
        populateContainer(container, [members.insert && members.contains ? key : value])

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
          result = container[fn](key)
        }
        else if (kind == 'NoArgs') {
          result = container[fn]()
        }
      })

      if (returns == 'value') {
        it('returns the value', () => {
          expect(result).toBe(value)
        })
      }
      if (returns == 'end') {
        it('does not return the original cursor', () => {
          expect(result).not.toBe(cursor)
        })
        it('returns end', () => {
          const end = container.end()
          expect(result.equals(end)).toBe(true)
        })
      }
      if (kind == 'CursorRange') {
        it('rejects a null last cursor', () => {
          populateContainer(container,
            [members.insert && members.contains ? key : value])
          const cursor = container[first]()
          expect(() => { container[fn](cursor, null) }).toThrow(TypeError)
        })
      }

      whenEmpty()
      })
  })
})
