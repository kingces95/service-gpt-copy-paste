export class CliPoller {
  #chunkIterator
  #input

  constructor(chunkIterator, input) {
    this.#chunkIterator = chunkIterator
    this.#input = input
  }

  async poll() {
    const { done, value } = await this.#chunkIterator.next()
    if (done)
      return false

    this.#input.pushBytes(value)
    return true
  }
}
