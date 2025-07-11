import { CursorFactory } from '../cursor/cursor-factory.js'

export class Container extends CursorFactory {
  #__version = 0
  #disposed = false
  
  constructor(CursorType) { 
    super(CursorType)
    this.#disposed = false
  }

  // cursor implementation
  __isActive$$(version) { return this.#__version == version }

  // cursor proxy
  __isActive$(version) { return this.__isActive$$(version) } 

  // A debug helper which detects when a cursor is invalidated. Typically,
  // this happens during an unshift of shift operation as that operation
  // invalidates all index cursors. Cursors that reference a node cannot be
  // invalidated so those containers will not bump the version.
  get __version$() { return this.#__version }
  __bumpVersion$() { this.#__version++ }
  
  throwEmpty$() { throw new Error(
    "Container is empty.") }
  throwDisposed$() { throw new Error(
    "Container has been disposed.") }

  // cursor implementation
  equatableTo$$(otherCursor) { return this == otherCursor.container$ } 

  // cursor proxy
  equatableTo$(otherCursor) {
    if (this.isDisposed) this.throwDisposed$()
    return super.equatableTo$(otherCursor)
  }

  // container implementation
  get front$() { this.throwNotImplemented$() }
  get back$() { this.throwNotImplemented$() }
  isEmpty$() { this.throwNotImplemented$() }
  dispose$() { }
  
  // dispose implementation
  get isDisposed() { return this.#disposed }

  dispose() {
    if (this.isDisposed) this.throwDisposed$()
    this.dispose$()
    this.#disposed = true
    return this
  }

  // container proxy
  get isEmpty() {
    if (this.isDisposed) this.throwDisposed$()
    return this.isEmpty$
  }

  data(cursor) {
    if (this.isDisposed) this.throwDisposed$()
    return super.data(cursor)
  }

  begin(recyclable) {
    if (this.isDisposed) this.throwDisposed$()
    return super.begin(recyclable)
  }
  end(recyclable, ...args) {
    if (this.isDisposed) this.throwDisposed$()
    return super.end(recyclable)
  }
}
