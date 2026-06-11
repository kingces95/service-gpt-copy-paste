import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import { 
  SpannableCursorConcept,
  SpannableCursorPart,
} from '@kingjs/cursor'
import { IndexableCursor } from './indexable-cursor.js'
import { genericType } from '@kingjs/generic'

export const ContiguousCursorOf = genericType(TSpan => {
  return class ContiguousCursor extends IndexableCursor {
    static spanType = TSpan

    constructor(indexable, index) {
      super(indexable, index)
    }

    static {
      implement(this, SpannableCursorConcept, {
        get spanType() { return this.constructor.spanType },
        span(other) { return this.container.span(this, other) },
      })
    }

    static {
      compose(this, SpannableCursorPart)
    }
  }
})

export const ContiguousCursor = ContiguousCursorOf(Object)
