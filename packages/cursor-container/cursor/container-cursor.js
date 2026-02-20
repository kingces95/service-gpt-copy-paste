import { implement } from '@kingjs/implement'
import { throwDisposed } from '@kingjs/cursor'
import { PartialProxy, TypePrecondition } from '@kingjs/partial-proxy'
import { ScopeConcept, DisposeConcept } from '@kingjs/concept'
import { PartialClass } from '@kingjs/partial-class'
import { ContainerCursorConcept } from '../container-cursor-concepts.js'

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
      get beginToken$() { },
      get endToken$() { },
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

export class ContainerCursor extends PartialProxy {
  static partialContainerType$ = PartialContainer
  static { PartialContainer.cursorType = this }
  
  #container
  #token

  constructor(container, token) {
    super()
    this.#container = container
    this.#token = token
  }

  get container() { return this.#container }
  get token() { return this.#token }
  set token(token) { this.#token = token }
  get isBegin() { return this.token === this.container.beginToken$ }
  get isEnd() { return this.token === this.container.endToken$ }

  static {
    implement(this, ScopeConcept, {
      equatableTo(other) {
        if (other?.constructor != this.constructor) return false
        return this.container == other.container
      }
    })
    
    implement(this, ContainerCursorConcept)
  }
}
