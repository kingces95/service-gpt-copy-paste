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
  Vector,
  Deque,
  NodeBuffer,
  EcmaBuffer 
} from '@kingjs/cursor-container'

const universalContainerConcepts = [
  RangeConcept,
  InputRangeConcept,
  OutputRangeConcept,
  ForwardRangeConcept,
  ContainerPart]
  
const reversibleContainerConcepts = [
  ...universalContainerConcepts,
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
  
const Tests = {
  List: {
    type: List,
    concepts: [
      ...universalContainerConcepts,
      FrontEditableContainerPart],
    members: {
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
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true, count: true,
      insert: true, erase: true,
    }
  },
  
  Vector: {
    type: Vector,
    concepts: [
      ClearableContainerPart,
      ...indexableContainerConcepts],
    members: {
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true, count: true,
      insert: true, erase: true,
    }
  },
  
  Deque: {
    type: Deque,
    concepts: [
      ClearableContainerPart,
      ...indexableContainerConcepts],
    members: {
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true, count: true,
      // insert: true, erase: true,
      at: true, // setAt: true,
    }
  },
  
  EcmaBuffer: {
    type: EcmaBuffer,
    concepts: [...bufferConainerConcepts],
    members: {
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true, count: true,
      insert: true, erase: true,
      at: true, setAt: true, readAt: true,
      capacity: true, setCapacity: true, ensureCapacity: true,
      copy: true, // insertRange: true, removeRange: true,
      data: true,
    }
  },

  NodeBuffer: {
    type: NodeBuffer,
    concepts: [...bufferConainerConcepts],
    members: {
      front: true, shift: true, unshift: true,
      back: true, pop: true, push: true, count: true,
      insert: true, erase: true,
      at: true, setAt: true, readAt: true,
      capacity: true, setCapacity: true, // ensureCapacity: true,
      copy: true, // insertRange: true, removeRange: true,
      data: true,
    }
  }
}

describe.each(Object.entries(Tests))('A %s', (name, { 
  type, concepts, members }) => {  

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
    beforeEach(() => {
      container = new type()
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

    function withCount(count) {
      describe(`now with count ${count}`, () => {
        if (members.count) it(`should have a count of ${count}`, () => {
          expect(container.count).toBe(count)
        })
        if (members.capacity) it(`should have a capacity of ${count} or more`, () => {
          expect(container.capacity).toBeGreaterThan(count)
        })
        if (members.data) it(`should have data length of ${count}`, () => {
          expect(container.data().length).toBe(count)
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
      ['unshift', ''], 
      ['push', ''],
      ['insert', 'begin'],
      ['insert', 'end'],
      ['insertAfter', 'beforeBegin'],
    ].filter(([method]) => members[method]))(
      'then %s(%s)', (fn, cursorFn) => {

      let value = 42
      beforeEach(() => {
        // container.unshift(value)
        // container.push(value)
        // container.insert(container.begin(), value)
        // container.insert(container.end(), value)
        // container.insertAfter(container.beforeBegin(), value)
        if (cursorFn) {
          const cursor = container[cursorFn]()
          container[fn](cursor, value)
        }
        else container[fn](value)
      })
      withCount(1)

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
        if (members.data) it('should have data matching the value', () => {
          expect(container.data()[0]).toBe(value)
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
        ['erase', 'begin'],
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
    })
  })
})
