import { describe, it, expect } from 'vitest'
import {
  List,
  ForwardList,
  ArrayMap,
} from '@kingjs/cursor-container'
import { iterate, next } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'
import { createContainer } from './create-container.js'

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

const Tests = {
  insertValue: {
    'in the middle of existing values': {
      initial: [1, 3],
      value: 2,
      cursor: target => target.begin().move(1),
      end: [1, 2, 3],
    },
  },

  erase: {
    'in the middle of existing values': {
      initial: [1, -2, 3],
      cursor: target => target.begin().move(1),
      end: [1, 3],
    },
  },

  insert: {
    'in the middle of existing values': {
      initial: [1, 5],
      cursor: target => target.begin().move(1),
      count: 3,
      value: 0,
      end: [1, 0, 0, 0, 5],
    },
  },

  eraseWithCount: {
    'in the middle of existing values': {
      initial: [1, -2, -3, 4],
      cursor: target => target.begin().move(1),
      count: 2,
      end: [1, 4],
    },
  },

  eraseToEnd: {
    'from the middle to the end': {
      initial: [1, -2, -3],
      cursor: target => target.begin().move(1),
      end: [1],
    },
  },

  eraseBeginToCursor: {
    'from the beginning to the middle': {
      initial: [-1, -2, 3],
      cursor: target => target.begin().move(2),
      end: [3],
    },
  },

  clear: {
    'with many values': {
      initial: [-1, -2, -3],
      end: [],
    },
  },

  replaceRange: {
    'in the middle of existing values': {
      initial: [1, -2, -3, 5],
      first: target => target.begin().move(1),
      last: target => target.begin().move(3),
      source: [2, 3, 4],
      end: [1, 2, 3, 4, 5],
    },

    'with the target used as source': {
      initial: [1, 9, 8, 5],
      first: target => target.begin().move(1),
      last: target => target.begin().move(3),
      source: target => target,
      end: [1, 1, 9, 8, 5, 5],
    },
  },

  assign: {
    'with many values': {
      initial: [-1, -2],
      count: 3,
      value: 0,
      end: [0, 0, 0],
    },
  },
}

const AfterTests = {
  insertAfter: {
    'in the middle of existing values': {
      initial: [1, 5],
      cursor: target => target.begin(),
      count: 3,
      value: 0,
      end: [1, 0, 0, 0, 5],
    },
  },

  replaceRangeAfter: {
    'in the middle of existing values': {
      initial: [1, -2, -3, 5],
      first: target => target.begin(),
      last: target => target.begin().step().step().step(),
      source: [2, 3, 4],
      end: [1, 2, 3, 4, 5],
    },

    'with the target used as source': {
      initial: [1, 9, 8, 5],
      first: target => target.begin(),
      last: target => target.begin().step().step().step(),
      source: target => target,
      end: [1, 1, 9, 8, 5, 5],
    },
  },
}

const BulkEditableContainers = [
  ArrayMap,
]

const PhasedBulkContainers = [
  ForwardList,
]

const BulkAssignableContainers = [
  ForwardList,
  List,
  ...BulkEditableContainers,
]

describe.each(BulkEditableContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('insertValue', () => {
    it.each(supportedCases(Tests.insertValue))('%s', (_, {
      initial,
      value,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insertValue(cursor(target), value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('erase', () => {
    it.each(supportedCases(Tests.erase))('%s', (_, {
      initial,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.erase(cursor(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('insert', () => {
    it.each(supportedCases(Tests.insert))('%s', (_, {
      initial,
      cursor,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insert(cursor(target), count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('erase with count', () => {
    it.each(supportedCases(Tests.eraseWithCount))('%s', (_, {
      initial,
      cursor,
      count,
      end,
    }) => {
      const target = createContainer(type, initial)

      const first = cursor(target)
      target.erase(first, next(first, count))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('erase to end', () => {
    it.each(supportedCases(Tests.eraseToEnd))('%s', (_, {
      initial,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.erase(cursor(target), target.end())

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('erase from begin', () => {
    it.each(supportedCases(Tests.eraseBeginToCursor))('%s', (_, {
      initial,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.erase(target.begin(), cursor(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('replaceRange', () => {
    it.each(supportedCases(Tests.replaceRange))('%s', (_, {
      initial,
      first,
      last,
      source,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.replaceRange(
        first(target),
        last(target),
        createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

})

describe.each(PhasedBulkContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('insertAfter', () => {
    it.each(supportedCases(AfterTests.insertAfter))('%s', (_, {
      initial,
      cursor,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insertAfter(cursor(target), count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('replaceRangeAfter', () => {
    it.each(supportedCases(AfterTests.replaceRangeAfter))('%s', (_, {
      initial,
      first,
      last,
      source,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.replaceRangeAfter(
        first(target),
        last(target),
        createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })
})

describe.each(BulkAssignableContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('clear', () => {
    it.each(supportedCases(Tests.clear))('%s', (_, {
      initial,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.clear()

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('assign', () => {
    it.each(supportedCases(Tests.assign))('%s', (_, {
      initial,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.assign(count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })
})
