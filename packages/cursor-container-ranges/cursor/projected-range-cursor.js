import { compose } from '@kingjs/partial-compose'
import { implement } from '@kingjs/partial-implement'
import { EquatableConcept } from '@kingjs/partial-concept'
import {
  CloneableCursorPart,
} from '@kingjs/cursor'
import { ContainerCursor } from '@kingjs/cursor-container'

export class ProjectedRangeCursor extends ContainerCursor {
  _sourceCursor
  _current

  constructor(container, sourceCursor, current = undefined) {
    super(container)
    this._sourceCursor = sourceCursor
    this._current = current
  }

  get sourceCursor() { return this._sourceCursor }
  set sourceCursor(sourceCursor) { this._sourceCursor = sourceCursor }
  get current() {
    if (this._current === undefined)
      this._current = this.container.decodeValue$(this.sourceCursor)

    return this._current
  }
  set current(current) { this._current = current }

  static {
    implement(this, EquatableConcept, {
      equals(other) {
        if (!this.equatableTo(other)) return false
        return this.sourceCursor.equals(other.sourceCursor)
      },
    })

    compose(this, CloneableCursorPart, {
      clone() {
        return new this.constructor(
          this.container,
          this.sourceCursor.clone(),
          this._current
        )
      },
    })
  }
}
