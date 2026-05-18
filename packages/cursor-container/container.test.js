import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { PartialReflect } from '@kingjs/partial-reflect'
import { 
  Concept,
} from '@kingjs/partial-concept'
import { 
  InputCursorConcept,
  OutputCursorConcept,
  MutableCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
} from '../cursor/cursor-concepts.js'
import {
  ContainerPart,
  IndexableContainerPart,
  BackEditableContainerPart,
  FrontEditableContainerPart,
  EditableContainerPart,
  SizedContainerPart,
  CapacityContainerPart,
  ReservableContainerPart,
  ByteContainerPart,
  ClearableContainerPart,
  BulkAssignableContainerPart,
  AfterBulkEditableContainerPart,
  BulkEditableContainerPart,
  AssociativeContainerPart,
  UnorderedSetContainerPart,
  UnorderedMapContainerPart,
} from '@kingjs/cursor-container'
import {
  RangeConcept,
  InputRangeConcept,
  OutputRangeConcept,
  ForwardRangeConcept,
  BidirectionalRangeConcept,
  RandomAccessRangeConcept,
  ContiguousRangeConcept,
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
import { single } from '@kingjs/cursor-adapter'

const universalContainerConcepts = [
  RangeConcept,
  InputRangeConcept,
  ContainerPart]

const sequenceContainerConcepts = [
  ...universalContainerConcepts,
  ForwardRangeConcept,
  OutputRangeConcept]
  
const reversibleContainerConcepts = [
  ...sequenceContainerConcepts,
  BidirectionalRangeConcept,
  FrontEditableContainerPart,
  BackEditableContainerPart]

const indexableContainerConcepts = [
  ...reversibleContainerConcepts,
  IndexableContainerPart,
  BackEditableContainerPart,
  RandomAccessRangeConcept,
  SizedContainerPart]
  
const bufferConainerConcepts = [
  ...indexableContainerConcepts,
  ContiguousRangeConcept,
  EditableContainerPart,
  CapacityContainerPart,
  ReservableContainerPart,
  ByteContainerPart]

const associativeContainerConcepts = [
  ...universalContainerConcepts,
  AssociativeContainerPart]
  
const Value = 42
const Key = 'key'

const PopulateOne = {
  Value: {
    unshift: {},
    push: {},
    insert: {},
  },
  CursorValue: {
    insertAt: { cursor: 'begin' },
    insertAfter: { cursor: 'beforeBegin' },
  },
  CursorRange: {
    insertRange: { cursor: 'begin' },
  },
  Range: {
    appendRange: {},
    prependRange: {},
    assignRange: {},
  },
  CursorCountValue: {
    insertCount: { cursor: 'begin' },
  },
  CountValue: {
    appendCount: {},
    prependCount: {},
  },
  SizeValue: {
    resizeTo: {},
    growTo: {},
  },
}

const DepopulateOne = {
  NoArgs: {
    pop: { returns: 'value' },
    shift: { returns: 'value' },
    erase: {},
    clear: {},
  },
  Cursor: {
    eraseAfter: { cursor: 'beforeBegin', returns: 'end' },
    eraseAt: { cursor: 'begin', returns: 'end' },
  },
  CursorRange: {
    eraseRange: {
      first: 'begin',
      last: cursor => cursor.clone().step(),
      returns: 'end',
    },
  },
  SizeValue: {
    resizeTo: { size: 0 },
  },
}

// Flatten grouped metadata to the members supported by a container while
// preserving the group name as `kind` metadata.
//
// supportedCases({
//   Range: { appendRange: {} },
//   Value: { push: {}, insert: {} },
// }, { push: true })
//
// returns [['push', { kind: 'Value' }]]
function supportedCases(groups, members) {
  return Object.entries(groups)
    .flatMap(([kind, tests]) => Object.entries(tests)
      .filter(([member]) => members[member])
      .map(([member, metadata]) => [
        member,
        { kind, ...metadata }
      ]))
}

const Tests = {
  UnorderedMap: {
    type: UnorderedMap,
    concepts: [
      ClearableContainerPart,
      UnorderedMapContainerPart,
      ...associativeContainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      has: true, remove: true,
      get: true, add: true,
      clear: true,
    },
    value: [Key, Value],
  },

  UnorderedSet: {
    type: UnorderedSet,
    concepts: [
      ClearableContainerPart,
      UnorderedSetContainerPart,
      ...associativeContainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      has: true, remove: true,
      add: true,
      clear: true,
    },
    key: Value,
  },
  
  ForwardList: {
    type: ForwardList,
    concepts: [
      ClearableContainerPart,
      BulkAssignableContainerPart,
      AfterBulkEditableContainerPart,
      ...sequenceContainerConcepts,
      FrontEditableContainerPart],
    members: {
      insert: true, erase: true,
      shift: true, unshift: true,
      beforeBegin: true, insertAfter: true, eraseAfter: true,
      clear: true,
      resizeTo: true,
      assignRange: true,
      insertRangeAfter: true,
      eraseRangeAfter: true,
      appendRange: true,
      prependRange: true,
      insertCountAfter: true,
      appendCount: true,
      prependCount: true,
      eraseCountAfter: true,
      eraseFromAfter: true,
      eraseUntilAfter: true,
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
    members: {
      insert: true, erase: true,
      beforeBegin: true, insertAfter: true, eraseAfter: true,
      size: true,
      clear: true,
      shift: true, unshift: true,
      pop: true, push: true,
      resizeTo: true,
      assignRange: true,
    }
  },
  
  Deque: {
    type: Deque,
    concepts: [
      ClearableContainerPart,
      BulkAssignableContainerPart,
      BulkEditableContainerPart,
      ...indexableContainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      shift: true, unshift: true,
      pop: true, push: true,
      at: true, // setAt: true, // should, but does not
      clear: true,
      
      // BulkAssignableContainerPart members
      resizeTo: true,
      assignRange: true,

      // BulkEditableContainerPart members
      insertRange: true,
      eraseRange: true,
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
    members: {
      insert: true, erase: true,
      size: true,
      shift: true, unshift: true,
      pop: true, push: true,
      at: true, setAt: true,
      clear: true,

      // BulkAssignableContainerPart members
      resizeTo: true,
      assignRange: true,

      // BulkEditableContainerPart members
      insertRange: true,
      eraseRange: true,
    }
  },
  
  Uint8Vector: {
    type: Uint8Vector,
    concepts: [
      BulkAssignableContainerPart,
      BulkEditableContainerPart,
      ...bufferConainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      shift: true, unshift: true,
      pop: true, push: true,
      at: true, setAt: true, // readAt: true,
      capacity: true, setCapacity: true, ensureCapacity: true,
      span: true,
      // clear: true,

      // BulkAssignableContainerPart members
      resizeTo: true,
      assignRange: true,

      // BulkEditableContainerPart members
      insertRange: true,
      eraseRange: true,
    }
  },
}

function withCount(context, size) {
  it('has equal begin cursors', () => {
    const begin1 = context.container.begin()
    const begin2 = context.container.begin()
    expect(begin1.equals(begin2)).toBe(true)
  })
  it('has equal end cursors', () => {
    const end1 = context.container.end()
    const end2 = context.container.end()
    expect(end1.equals(end2)).toBe(true)
  })      
  it(size == 0 ? 'has begin equal to end' : 'has begin distinct from end', () => {
    const begin = context.container.begin()
    const end = context.container.end()
    expect(begin.equals(end)).toBe(size == 0)
  })
  if (context.members.size) it(`reports size ${size}`, () => {
    expect(context.container.size).toBe(size)
  })
  if (context.members.capacity) it(`has capacity greater than ${size}`, () => {
    expect(context.container.capacity).toBeGreaterThan(size)
  })
  if (context.members.span) it(`has span length ${size}`, () => {
    expect(context.container.span().length).toBe(size)
  })
}

function whenEmpty(context) {
  it('is empty', () => {
    expect(context.container.isEmpty).toBe(true)
  })
  if (context.members.shift) it('rejects shift', () => {
    expect(() => { context.container.shift() }).toThrow(context.isEmpty)
  })
  if (context.members.at) it('rejects at', () => {
    expect(() => { context.container.at(0) }).toThrow(context.readOutOfBounds)
  })
  if (context.members.setAt) it('rejects setAt', () => {
    expect(() => { context.container.setAt(0, 42) }).toThrow(context.writeOutOfBounds)
  })
  if (context.members.readAt) it('rejects readAt', () => {
    expect(() => { context.container.readAt(0) }).toThrow(
      'Cannot read 1 byte(s) at index 1.')
  })
  withCount(context, 0)
}

describe.each(Object.entries(Tests))('A %s', (name, { 
  type, concepts, members, value = Value, key = Key }) => {  

  let container
  let otherContainer
  beforeEach(() => {
    container = new type()
    otherContainer = new type()
  })

  const isEmpty = 'Container is empty.'
  const readOutOfBounds = 'Cannot read value out of bounds of cursor.'
  const writeOutOfBounds = 'Cannot write value out of bounds of cursor.'
  const context = {
    get container() { return container },
    members,
    isEmpty,
    readOutOfBounds,
    writeOutOfBounds,
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
    whenEmpty(context)
  })

  if (members.setCapacity || members.ensureCapacity) {
    describe('Capacity', () => {
      let capacity
      beforeEach(() => {
        capacity = container.capacity
      })
      it('accepts the current capacity', () => {
        expect(container.setCapacity(capacity)).toBe(capacity)
      })
      it('accepts one more capacity', () => {
        expect(container.setCapacity(capacity + 1)).toBe(capacity + 1)
      })
      it('keeps capacity when ensuring current capacity', () => { 
        expect(container.ensureCapacity(capacity)).toBe(capacity)
      })
      it('doubles capacity when ensuring one more capacity', () => {
        const newCapacity = container.ensureCapacity(capacity + 1)
        expect(newCapacity).toBe(capacity * 2)
      })
    })
  }

  describe('when populated with', () => {
    describe.each(supportedCases(PopulateOne, members))(
      '%s', (fn, { kind, cursor: cursorFn }) => {

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
        else if (kind == 'CursorValue') {
          container[fn](value, container[cursorFn]())
        }
        else if (kind == 'Value') {
          container[fn](value)
        }
      })
      withCount(context, 1)

      if (kind == 'CursorValue') {
        // test argument checking: null, equatable, end, out of bounds, etc.
        it('rejects a null cursor', () => {
          expect(() => { container[fn](value, null) }).toThrow()
        })
        it('rejects a cursor from another container', () => {
          const otherCursor = otherContainer.begin()
          expect(() => { container[fn](value, otherCursor) }).toThrow()
        })
        it('rejects an out-of-bounds cursor', () => {
          const endCursor = container.end()
          expect(() => { container[fn](value, endCursor) }).toThrow()
        })
      }

      it('is not empty', () => {
        expect(container.isEmpty).toBe(false)
      })
      if (members.at) it('has value at index 0', () => {
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
      if (members.has) it('has the value', () => {
        expect(container.has(key)).toBe(true)
      })
      if (members.get) it('gets the value by key', () => {
        expect(container.get(key)).toBe(value[1])
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
        container.insert(value)

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

      whenEmpty(context)
      })
  })
})
