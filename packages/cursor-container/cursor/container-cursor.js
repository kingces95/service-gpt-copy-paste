import { implement } from '@kingjs/implement'
import { Cursor, throwDisposed } from '@kingjs/cursor'
import { TypePrecondition } from '@kingjs/partial-proxy'
import { DisposeConcept } from '@kingjs/concept'
import { PartialClass } from '@kingjs/partial-class'

const __disposed = Symbol('__disposed')

export class PartialContainer extends PartialClass {

  static [TypePrecondition]() {
    if (this.__disposed) throwDisposed()
  }

  // static cursorType = ContainerCursor

  static [__disposed] = false

  get __isDisposed() { return !!this[__disposed] }
  
  static {
    implement(this, {
      dispose$() { },
    })

    implement(this, DisposeConcept, {
      dispose() {
        this.dispose$()
        this[__disposed] = true
        return this
      }
    })
  }
}

export class ContainerCursor extends Cursor {
  static partialContainerType$ = PartialContainer
  static { PartialContainer.cursorType = this }
  
  #token

  constructor(container, token) {
    super(container)
    this.#token = token
  }

  get container() { return this.range }
  get token() { return this.#token }
  set token(token) { this.#token = token }
}
