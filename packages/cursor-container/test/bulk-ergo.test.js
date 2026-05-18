import { describe, it, expect } from 'vitest'
import {
  Chain,
  List,
  VectorMap,
} from '@kingjs/cursor-container'
import { iterate } from '@kingjs/cursor-algorithm'
import { SnapshotView } from '@kingjs/cursor-view'

function createContainer(type, values = []) {
  const result = new type()

  if (type == List)
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

const Tests = {
  insertAt: {
    'in the middle of existing values': {
      initial: [1, 3],
      value: 2,
      cursor: target => target.begin().move(1),
      end: [1, 2, 3],
    },
  },

  eraseAt: {
    'in the middle of existing values': {
      initial: [1, -2, 3],
      cursor: target => target.begin().move(1),
      end: [1, 3],
    },
  },

  appendRange: {
    'with many values': {
      initial: [1],
      source: [2, 3],
      end: [1, 2, 3],
    },
  },

  prependRange: {
    'with many values': {
      initial: [3],
      source: [1, 2],
      end: [1, 2, 3],
    },
  },

  insertCount: {
    'in the middle of existing values': {
      initial: [1, 5],
      cursor: target => target.begin().move(1),
      count: 3,
      value: 0,
      end: [1, 0, 0, 0, 5],
    },
  },

  appendCount: {
    'with many values': {
      initial: [1],
      count: 2,
      value: 0,
      end: [1, 0, 0],
    },
  },

  prependCount: {
    'with many values': {
      initial: [3],
      count: 2,
      value: 0,
      end: [0, 0, 3],
    },
  },

  eraseCount: {
    'in the middle of existing values': {
      initial: [1, -2, -3, 4],
      cursor: target => target.begin().move(1),
      count: 2,
      end: [1, 4],
    },
  },

  eraseFrom: {
    'from the middle to the end': {
      initial: [1, -2, -3],
      cursor: target => target.begin().move(1),
      end: [1],
    },
  },

  eraseUntil: {
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

  growTo: {
    'with many values': {
      initial: [1],
      count: 3,
      value: 0,
      end: [1, 0, 0],
    },
  },

  truncateTo: {
    'with many values': {
      initial: [1, -2, -3],
      count: 1,
      end: [1],
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

  assignCount: {
    'with many values': {
      initial: [-1, -2],
      count: 3,
      value: 0,
      end: [0, 0, 0],
    },
  },
}

const BulkEditableContainers = [
  VectorMap,
]

const BulkAssignableContainers = [
  List,
  Chain,
  ...BulkEditableContainers,
]

describe.each(BulkEditableContainers.map(Type => [Type.name, Type]))(
  '%s', (_, type) => {
  describe('insertAt', () => {
    it.each(supportedCases(Tests.insertAt))('%s', (_, {
      initial,
      value,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insertAt(value, cursor(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('eraseAt', () => {
    it.each(supportedCases(Tests.eraseAt))('%s', (_, {
      initial,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.eraseAt(cursor(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('appendRange', () => {
    it.each(supportedCases(Tests.appendRange))('%s', (_, {
      initial,
      source,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.appendRange(createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('prependRange', () => {
    it.each(supportedCases(Tests.prependRange))('%s', (_, {
      initial,
      source,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.prependRange(createSource(source, target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('insertCount', () => {
    it.each(supportedCases(Tests.insertCount))('%s', (_, {
      initial,
      cursor,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.insertCount(cursor(target), count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('appendCount', () => {
    it.each(supportedCases(Tests.appendCount))('%s', (_, {
      initial,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.appendCount(count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('prependCount', () => {
    it.each(supportedCases(Tests.prependCount))('%s', (_, {
      initial,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.prependCount(count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('eraseCount', () => {
    it.each(supportedCases(Tests.eraseCount))('%s', (_, {
      initial,
      cursor,
      count,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.eraseCount(cursor(target), count)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('eraseFrom', () => {
    it.each(supportedCases(Tests.eraseFrom))('%s', (_, {
      initial,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.eraseFrom(cursor(target))

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('eraseUntil', () => {
    it.each(supportedCases(Tests.eraseUntil))('%s', (_, {
      initial,
      cursor,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.eraseUntil(cursor(target))

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

  describe('growTo', () => {
    it.each(supportedCases(Tests.growTo))('%s', (_, {
      initial,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.growTo(count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('truncateTo', () => {
    it.each(supportedCases(Tests.truncateTo))('%s', (_, {
      initial,
      count,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.truncateTo(count)

      expect(valuesOf(target)).toEqual(end)
    })
  })

  describe('assignCount', () => {
    it.each(supportedCases(Tests.assignCount))('%s', (_, {
      initial,
      count,
      value,
      end,
    }) => {
      const target = createContainer(type, initial)

      target.assignCount(count, value)

      expect(valuesOf(target)).toEqual(end)
    })
  })
})
