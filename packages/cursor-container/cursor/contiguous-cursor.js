import { implement } from '@kingjs/partial-implement'
import { compose } from '@kingjs/partial-compose'
import { 
  SpannableCursorConcept,
  SpannableCursorPart,
} from '@kingjs/cursor'
import { IndexableCursor } from './indexable-cursor.js'

export class ContiguousCursor extends IndexableCursor {

  constructor(indexable, index) {
    super(indexable, index)
  }

  static { 
    implement(this, SpannableCursorConcept, {
      get spanType() { return this.container.spanType },
      span(other) { return this.container.span(this, other) },
    }) 
  }

  static {
    compose(this, SpannableCursorPart)
  }
}
