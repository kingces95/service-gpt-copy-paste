export class AbstractContainer {
  #__version = 0

  constructor() { }

  get __version$() { return this.#__version }
  __bumpVersion$() { this.#__version++ }

  get isEmpty() { return this.begin().isEnd }

  begin() { throw new Error("Not implemented.") }
  end() { throw new Error("Not implemented.") }

}

export class AbstractQueue extends AbstractContainer {
  constructor() {
    super()
  }

  push(value) { throw new Error("Not implemented.") }
  pop() { throw new Error("Not implemented.") }
}
