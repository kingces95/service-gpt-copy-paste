import { describe, it, expect } from 'vitest'
import {
  ForwardList,
  List,
  Deque,
  Uint8Vector,
  ArrayMap,
} from '@kingjs/cursor-container'
import { iterate } from '@kingjs/cursor-algorithm'
import { createContainer } from './create-container.js'

function valuesOf(container) {
  return [...iterate(container)]
}

const BulkAssignableContainers = [
  ForwardList,
  List,
  Deque,
  ArrayMap,
  Uint8Vector,
]

const BulkEditableContainers = [
  Deque,
  ArrayMap,
  Uint8Vector,
]

const PhasedBulkContainers = [
  ForwardList,
  List,
]

describe('source overlap', () => {
  describe.each(BulkAssignableContainers.map(Type => [Type.name, Type]))(
    '%s assignRange', (_, Type) => {
    it('snapshots the target before assigning it to itself', () => {
      const target = createContainer(Type, [1, 2, 3])

      target.assignRange(target)

      expect(valuesOf(target)).toEqual([1, 2, 3])
    })
  })

  describe.each(BulkEditableContainers.map(Type => [Type.name, Type]))(
    '%s insertRange', (_, Type) => {
    it('snapshots the target before inserting it into itself', () => {
      const target = createContainer(Type, [1, 4])

      target.insertRange(target.begin().move(1), target)

      expect(valuesOf(target)).toEqual([1, 1, 4, 4])
    })
  })

  describe.each(BulkEditableContainers.map(Type => [Type.name, Type]))(
    '%s replaceRange', (_, Type) => {
    it('snapshots the target before replacing a range with itself', () => {
      const target = createContainer(Type, [1, 9, 8, 5])

      target.replaceRange(
        target.begin().move(1),
        target.begin().move(3),
        target)

      expect(valuesOf(target)).toEqual([1, 1, 9, 8, 5, 5])
    })
  })

  describe.each(PhasedBulkContainers.map(Type => [Type.name, Type]))(
    '%s insertRangeAfter', (_, Type) => {
    it('snapshots the target before inserting it after one of its cursors', () => {
      const target = createContainer(Type, [1, 4])

      target.insertRangeAfter(target.begin(), target)

      expect(valuesOf(target)).toEqual([1, 1, 4, 4])
    })
  })

  describe.each(PhasedBulkContainers.map(Type => [Type.name, Type]))(
    '%s replaceRangeAfter', (_, Type) => {
    it('snapshots the target before replacing a range after a cursor', () => {
      const target = createContainer(Type, [1, 9, 8, 5])

      target.replaceRangeAfter(
        target.begin(),
        target.begin().step().step().step(),
        target)

      expect(valuesOf(target)).toEqual([1, 1, 9, 8, 5, 5])
    })
  })
})
