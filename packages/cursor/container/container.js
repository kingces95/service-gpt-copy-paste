export class Container {
  #__version = 0

  constructor() { }

  cursor$(recyclable, ...args) {
    const Cursor = this.constructor.Cursor
    return recyclable 
      ? recyclable.recycle$(this, ...args) 
      : new Cursor(this, ...args)
  }

  get __version$() { return this.#__version }
  __bumpVersion$() { this.#__version++ }
  __throwIfDisposed$() {
    if (this.#__version === null) 
      throw new Error("Container has been disposed.")
  }

  get isEmpty() { return this.begin().isEnd }
  get isDisposed() { return this.#__version === null }

  begin(recyclable, ...args) {
    this.__throwIfDisposed$()
    return this.cursor$(recyclable, ...args)
  }
  end(recyclable, ...args) {
    this.__throwIfDisposed$()
    return this.cursor$(recyclable, ...args)
  }

  cbegin(recyclable, ...args) {
    const begin = this.begin(recyclable, ...args)
    begin.isReadOnly = true
    return begin
  }
  cend(recyclable, ...args) {
    const end = this.end(recyclable, ...args)
    end.isReadOnly = true
    return end
  }
  
  dispose() {
    this.__throwIfDisposed$()
    this.#__version = null
    return this
  }
}
