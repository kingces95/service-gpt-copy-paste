import { VirtualContainer } from '@kingjs/cursor-virtual'
import { CliPoller } from './cli-poller.js'
import { CliTextBuffer } from './cli-text-buffer.js'

export class CliSipper {
  #poller
  #buffer

  constructor(chunkIterator, encoding, input = new VirtualContainer()) {
    this.#poller = new CliPoller(chunkIterator, input)
    this.#buffer = new CliTextBuffer(encoding, input)
  }

  async #poll() {
    return this.#poller.poll()
  }

  async #drain() {
    while (await this.#poll()) { }
  }

  #readValue() {
    const result = this.#buffer.read()
    return result == '' ? null : result
  }

  async read() {
    await this.#drain()
    return this.#buffer.read()
  }

  async sipLine(options) {
    while (true) {
      const result = this.#buffer.tryReadLine(options)
      if (result != null)
        return result

      if (await this.#poll())
        continue

      return this.#readValue()
    }
  }

  async sipString(charCount = Infinity) {
    if (charCount === Infinity) {
      await this.#drain()
      return this.#readValue()
    }

    while (true) {
      const result = this.#buffer.tryReadString(charCount)
      if (result != null)
        return result

      if (await this.#poll())
        continue

      return this.#readValue()
    }
  }
}
