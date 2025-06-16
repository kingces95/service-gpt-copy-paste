export class AbstractContainer {
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

  get isEmpty() { return this.begin().isEnd }

  begin(recyclable, ...args) { throw new Error("Not implemented.") }
  end(recyclable, ...args) { throw new Error("Not implemented.") }
}

export class AbstractQueue extends AbstractContainer {
  constructor() {
    super()
  }

  push(value) { throw new Error("Not implemented.") }
  pop() { throw new Error("Not implemented.") }
}
