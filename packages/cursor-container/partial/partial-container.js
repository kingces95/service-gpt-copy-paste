import { implement } from '@kingjs/partial-implement'
import { throwDisposed } from '@kingjs/cursor'
import { TypePrecondition } from '@kingjs/partial-proxy'
import { DisposeConcept } from '@kingjs/partial-concept'
import { PartialClass } from '@kingjs/partial-class'
import { ContainerCursor } from '../cursor/container-cursor.js'

const __disposed = Symbol('__disposed')

export class PartialContainer extends PartialClass {
  static cursorType = ContainerCursor

  static [TypePrecondition]() {
    if (this.__disposed) throwDisposed()
  }

  // static cursorType = ContainerCursor

  static [__disposed] = false

  get __isDisposed() { return !!this[__disposed] }

  dispose$() { }
  
  static {
    // TODO: use/implement defineAbstract(...)
    // implement(this, {
    //   dispose$() { },
    // })

    implement(this, DisposeConcept, {
      dispose() {
        this.dispose$()
        this[__disposed] = true
        return this
      }
    })
  }
}
