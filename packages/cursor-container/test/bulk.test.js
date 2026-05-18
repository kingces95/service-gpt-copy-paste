import { describe, it, expect } from 'vitest'
import {
  List,
  Deque,
  ForwardList,
  Uint8Vector,
  VectorMap,
} from '@kingjs/cursor-container'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'

function createContainer(Type, values = []) {
  const result = new Type()

  if (Type == ForwardList)
    values = [...values].reverse()

  for (const value of values)
    result.insert(value, { })

  return result
}

function createSource(source, target) {
  if (typeof source == 'function') return source(target)
  return new SnapshotView(source)
}

function valuesOf(container) {
  return [...iterate(container)]
}

function supportedCases(cases) {
  return Object.entries(cases)
}

const BulkEditableContainers = [
  Deque,
  VectorMap,
  Uint8Vector,
]

const AfterBulkEditableContainers = [
  ForwardList,
]

const BulkAssignableContainers = [
  ForwardList,
  List,
  ...BulkEditableContainers,
]

const Tests = {
  insertRange: {
    'with an empty range': {
      initial: [],
      source: [],
      at: target => target.end(),
      end: [],
    },

    'with a single value': {
      initial: [],
      source: [1],
      at: target => target.end(),
      end: [1],
    },

    'with many values': {
      initial: [],
      source: [1, 2, 3],
      at: target => target.end(),
      end: [1, 2, 3],
    },

    'in the middle of existing values': {
      initial: [1, 5],
      source: [2, 3, 4],
      at: target => target.begin().move(1),
      end: [1, 2, 3, 4, 5],
    },

    'with the target used as source': {
      initial: [1, 4],
      source: target => target,
      at: target => target.begin().move(1),
      end: [1, 1, 4, 4],
    },
  },

  eraseRange: {
    'with an empty range': {
      initial: [1],
      first: target => target.begin(),
      last: target => target.begin(),
      end: [1],
    },

    'with a single value': {
      initial: [-1],
      first: target => target.begin(),
      last: target => target.begin().move(1),
      end: [],
    },

    'with many values': {
      initial: [-1, -2, -3],
      first: target => target.begin(),
      last: target => target.end(),
      end: [],
    },

    'in the middle of existing values': {
      initial: [1, -2, -3, -4, 2],
      first: target => target.begin().move(1),
      last: target => target.begin().move(4),
      end: [1, 2],
    },
  },

  insertRangeAfter: {
    'with an empty range': {
      initial: [],
      source: [],
      after: target => target.beforeBegin(),
      end: [],
    },

    'with a single value': {
      initial: [],
      source: [1],
      after: target => target.beforeBegin(),
      end: [1],
    },

    'with many values': {
      initial: [],
      source: [1, 2, 3],
      after: target => target.beforeBegin(),
      end: [1, 2, 3],
    },

    'in the middle of existing values': {
      initial: [1, 5],
      source: [2, 3, 4],
      after: target => target.begin(),
      end: [1, 2, 3, 4, 5],
    },

    'with the target used as source': {
      initial: [1, 4],
      source: target => target,
      after: target => target.begin(),
      end: [1, 1, 4, 4],
    },
  },

  eraseRangeAfter: {
    'with an empty range': {
      initial: [1],
      first: target => target.beforeBegin(),
      last: target => target.begin(),
      end: [1],
    },

    'with a single value': {
      initial: [-1],
      first: target => target.beforeBegin(),
      last: target => target.end(),
      end: [],
    },

    'with many values': {
      initial: [-1, -2, -3],
      first: target => target.beforeBegin(),
      last: target => target.end(),
      end: [],
    },

    'in the middle of existing values': {
      initial: [1, -2, -3, -4, 2],
      first: target => target.begin(),
      last: target => target.begin().step().step().step().step(),
      end: [1, 2],
    },
  },

  resizeTo: {
    'with an empty range': {
      initial: [-1, -2],
      count: 0,
      end: [],
    },

    'with a single value': {
      initial: [],
      count: 1,
      value: 0,
      end: [0],
    },

    'with many values': {
      initial: [1],
      count: 4,
      value: 0,
      end: [1, 0, 0, 0],
    },
  },

  assignRange: {
    'with an empty range': {
      initial: [-1, -2],
      source: [],
      end: [],
    },

    'with a single value': {
      initial: [-1, -2],
      source: [1],
      end: [1],
    },

    'with many values': {
      initial: [-1, -2],
      source: [1, 2, 3],
      end: [1, 2, 3],
    },

    'with the target used as source': {
      initial: [1, 2, 3],
      source: target => target,
      end: [1, 2, 3],
    },
  },
}

describe.each(BulkEditableContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('insertRange', () => {
    it.each(supportedCases(Tests.insertRange))('%s', (_, {
      initial,
      source,
      at,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insertRange(at(target), createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('eraseRange', () => {
    it.each(supportedCases(Tests.eraseRange))('%s', (_, {
      initial,
      first,
      last,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.eraseRange(first(target), last(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })
})

describe.each(AfterBulkEditableContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('insertRangeAfter', () => {
    it.each(supportedCases(Tests.insertRangeAfter))('%s', (_, {
      initial,
      source,
      after,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insertRangeAfter(after(target), createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('eraseRangeAfter', () => {
    it.each(supportedCases(Tests.eraseRangeAfter))('%s', (_, {
      initial,
      first,
      last,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.eraseRangeAfter(first(target), last(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })
})

describe.each(BulkAssignableContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('resizeTo', () => {
    it.each(supportedCases(Tests.resizeTo))('%s', (_, {
      initial,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.resizeTo(count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('assignRange', () => {
    it.each(supportedCases(Tests.assignRange))('%s', (_, {
      initial,
      source,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.assignRange(createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })
})
