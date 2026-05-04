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
  SpliceableContainerPart,
  BackEditableContainerPart,
  FrontEditableContainerPart,
  EditableContainerPart,
  SizedContainerPart,
  CapacityContainerPart,
  ReservableContainerPart,
  ByteContainerPart,
  ClearableContainerPart,
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
  List,
  Chain,
  VectorMap,
  Deque,
  NodeBuffer,
  EcmaBuffer,
  UnorderedMap,
  UnorderedSet,
} from '@kingjs/cursor-container'
import { value } from '@kingjs/abstract'

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
  BackEditableContainerPart,
  EditableContainerPart]

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
  
  List: {
    type: List,
    concepts: [
      ...sequenceContainerConcepts,
      FrontEditableContainerPart],
    members: {
      insert: true, erase: true,
      front: true, shift: true, unshift: true,
      beforeBegin: true, insertAfter: true, eraseAfter: true,
    }
  },
  
  Chain: {
    type: Chain,
    concepts: [
      ...reversibleContainerConcepts,
      SpliceableContainerPart,
      SizedContainerPart],
    members: {
      insert: true, erase: true,
      size: true,
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true,
    }
  },

  VectorMap: {
    type: VectorMap,
    concepts: [
      ClearableContainerPart,
      ...indexableContainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true,
      at: true, setAt: true,
      clear: true,
    }
  },
  
  Deque: {
    type: Deque,
    concepts: [
      ClearableContainerPart,
      ...indexableContainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true,
      at: true, // setAt: true, // should, but does not
      clear: true,
    }
  },
  
  EcmaBuffer: {
    type: EcmaBuffer,
    concepts: [...bufferConainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true,
      at: true, setAt: true, readAt: true,
      capacity: true, setCapacity: true, ensureCapacity: true,
      copy: true, // insertRange: true, removeRange: true,
      data: true,
      // clear: true,
    }
  },

  NodeBuffer: {
    type: NodeBuffer,
    concepts: [...bufferConainerConcepts],
    members: {
      insert: true, erase: true,
      size: true,
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true,
      at: true, setAt: true, readAt: true,
      capacity: true, setCapacity: true, // ensureCapacity: true,
      copy: true, // insertRange: true, removeRange: true,
      data: true,
      // clear: true,
    }
  }
}

describe.each(Object.entries(Tests))('A %s', (name, { 
  type, concepts, members, value = Value, key = Key }) => {  

  describe('type', () => {
    it('should be instanceof its concepts', () => {
      for (const concept of concepts) {
        if (type.prototype instanceof concept == false) throw new Error(
          `${type.name} does not implement ${concept.name}.`)
        expect(type.prototype instanceof concept).toBe(true)
      }
    })
    it('should have only expected concepts', () => {
      const set = new Set(concepts)
      const baseConcepts = [...PartialReflect.baseTypes(type)]
        .filter(current => PartialReflect.isExtensionOf(current, Concept))
      for (const concept of baseConcepts) {
        if (set.has(concept) == false) throw new Error(
          `${type.name} implements unexpected concept ${concept.name}.`)
        expect(set.has(concept)).toBe(true)
      }
    })
    it('should define expected members', () => {
      for (const member of Reflect.ownKeys(members)) {
        expect(member in type.prototype)
      }
    })
  })

  const isEmpty = 'Container is empty.'
  const readOutOfBounds = 'Cannot read value out of bounds of cursor.'
  const writeOutOfBounds = 'Cannot write value out of bounds of cursor.'

  describe('instance', () => {
    let container
    let otherContainer
    beforeEach(() => {
      container = new type()
      otherContainer = new type()
    })
    it('should not have cursors equal to another container', () => {
      const begin1 = container.begin()
      const begin2 = otherContainer.begin()
      expect(begin1.equals(begin2)).toBe(false)
    })
    if (members.copy) it('should be able to null copy', () => {
      const begin = container.begin()
      const end = container.end()
      container.copy(begin, begin, end)
    })
    if (members.data) it('data should be a Uint8Array', () => { 
      expect(container.data()).toBeInstanceOf(Uint8Array)
    })
    if (members.setCapacity || members.ensureCapacity) {
      let capacity
      beforeEach(() => {
        capacity = container.capacity
      })
      it('should be able to +0 capacity', () => {
        expect(container.setCapacity(capacity)).toBe(capacity)
      })
      it('should be able to +1 capacity', () => {
        expect(container.setCapacity(capacity + 1)).toBe(capacity + 1)
      })
      it('should not change capacity when ensuring current capacity', () => { 
        expect(container.ensureCapacity(capacity)).toBe(capacity)
      })
      it('should double capacity when ensureing +1 capacity', () => {
        const newCapacity = container.ensureCapacity(capacity + 1)
        expect(newCapacity).toBe(capacity * 2)
      })
    }

    function withCount(size) {
      describe(`now with size ${size}`, () => {
        it('should have equal begin cursors', () => {
          const begin1 = container.begin()
          const begin2 = container.begin()
          expect(begin1.equals(begin2)).toBe(true)
        })
        it('should have equal end cursors', () => {
          const end1 = container.end()
          const end2 = container.end()
          expect(end1.equals(end2)).toBe(true)
        })      
        it('should have begin equal end iff size is 0', () => {
          const begin = container.begin()
          const end = container.end()
          expect(begin.equals(end)).toBe(size == 0)
        })
        if (members.size) it(`should have a size of ${size}`, () => {
          expect(container.size).toBe(size)
        })
        if (members.capacity) it(`should have a capacity of ${size} or more`, () => {
          expect(container.capacity).toBeGreaterThan(size)
        })
        if (members.data) it(`should have data length of ${size}`, () => {
          expect(container.data().length).toBe(size)
        })
      })
    }

    function whenEmpty() {
      describe('now empty', () => {

        it('should be empty', () => {
          expect(container.isEmpty).toBe(true)
        })
        if (members.shift) it('should throw on shift', () => {
          expect(() => { container.shift() }).toThrow(isEmpty)
        })
        if (members.front) it('should not have a front value', () => {
          expect(() => { container.front }).toThrow(isEmpty)
        })
        if (members.back) it('should not have a back value', () => {
          expect(() => { container.back }).toThrow(isEmpty)
        })
        if (members.at) it('should throw on at', () => {
          expect(() => { container.at(0) }).toThrow(readOutOfBounds)
        })
        if (members.setAt) it('should throw on setAt', () => {
          expect(() => { container.setAt(0, 42) }).toThrow(writeOutOfBounds)
        })
        if (members.readAt) it('should throw on readAt', () => {
          expect(() => { container.readAt(0) }).toThrow(
            'Cannot read 1 byte(s) at index 1.')
        })
      })
      withCount(0)
    }
    whenEmpty()

    describe.each([
      // ['add', ''],
      ['unshift', ''], 
      ['push', ''],
      ['insert', ''],
      ['insertAt', 'begin'],
      ['insertAt', 'end'],
      ['insertAfter', 'beforeBegin'],
    ].filter(([method]) => members[method]))(
      'then %s(%s)', (fn, cursorFn) => {

      beforeEach(() => {
        // container.unshift(value)
        // container.push(value)
        // container.insert(value, container.begin())
        // container.insert(value, container.end())
        // container.insertAfter(value, container.beforeBegin())
        if (cursorFn) {
          const cursor = container[cursorFn]()
          container[fn](value, cursor)
        }
        else container[fn](value)
      })
      withCount(1)

      if (cursorFn) {
        // test argument checking: null, equatable, end, out of bounds, etc.
        it('should throw if cursor is null', () => {
          expect(() => { container[fn](value, null) }).toThrow()
        })
        it('should throw if cursor is not from the container', () => {
          const otherCursor = otherContainer.begin()
          expect(() => { container[fn](value, otherCursor) }).toThrow()
        })
        it('should throw if cursor is out of bounds', () => {
          const endCursor = container.end()
          expect(() => { container[fn](value, endCursor) }).toThrow()
        })
      }

      describe('now not empty', () => {
        it('should not be empty', () => {
          expect(container.isEmpty).toBe(false)
        })
        if (members.front) it('should have a front value', () => {
          expect(container.front).toBe(value)
        })
        if (members.at) it('should have a value at index 0', () => {
          expect(container.at(0)).toBe(value)
        })
        if (members.setAt) it('should be able to set a value at index 0', () => {
          container.setAt(0, value + 1)
          expect(container.at(0)).toBe(value + 1)
        })
        if (members.readAt) it('shoud read a value at index 0', () => {
          expect(container.readAt(0)).toBe(value)
        })
        if (members.setAt) it('should be able to set a value at index 0', () => {
          container.setAt(0, value + 1)
          expect(container.at(0)).toBe(value + 1)
        })
        if (members.data) it('should have data matching the value', () => {
          expect(container.data()[0]).toBe(value)
        })
        if (members.has) it('should have the value', () => {
          expect(container.has(key)).toBe(true)
        })
        if (members.get) it('should get the value by key', () => {
          expect(container.get(key)).toBe(value[1])
        })
      })
      describe.each([
        ['pop'],
        ['shift'],
      ].filter(([method]) => members[method]))(
        'then %s-ing', (fn) => {

        let result
        beforeEach(() => {
          // container.pop()
          // container.shift()
          result = container[fn]()
        })
        it('should return cursor or end', () => {
          expect(result).toBe(value)
        })
        whenEmpty()
      })        
      describe.each([
        ['eraseAfter', 'beforeBegin'],
        ['eraseAt', 'begin'],
      ].filter(([method]) => members[method]))(
        'then %s-ing', (fn, cursorFn) => {

        let result
        let cursor
        beforeEach(() => {
          // container.eraseAfter(container.beforeBegin())
          // container.erase(container.begin())
          cursor = container[cursorFn]()
          result = container[fn](cursor)
        })
        it('should not return the cursor', () => {
          expect(result).not.toBe(cursor)
        })
        it('result should equal end', () => {
          const end = container.end()
          expect(result.equals(end)).toBe(true)
        })
        whenEmpty()
      })
      if (members.erase) {
        describe('then erase-ing', () => {
          beforeEach(() => { container.erase() })
          whenEmpty()
        })
      }
      if (members.clear) {
        describe('then clear-ing', () => {
          beforeEach(() => {
            container.clear()
          })
          whenEmpty()
        })
      }
    })
  })
})
