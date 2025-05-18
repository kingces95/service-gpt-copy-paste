export class Disposer {
  #fn
  constructor(fn) {
    this.#fn = fn
  }
  async dispose() {
    return await this.#fn()
  }
}