import { ContiguousContainer, ContiguousCursor } from '../contiguous-container.js'

const NodeBuffer = Buffer

// Contiguous Container is an abstract class that represents a range
// of memory or "contiguous bytes". Memory implies operations beyond that
// of a sequence container, such as the ability to decode to a number in 
// a signle operation given an offset, sign, length in bytes, and endianness.

// Operations:
// - data: returns a node Buffer which can be used to decode integers, 
//         floats, etc.
export class Buffer extends ContiguousContainer {
  static get Cursor() { return ContiguousCursor }

  #buffer

  constructor(buffer) {
    super()

    if (!(buffer instanceof NodeBuffer)) throw new TypeError(
      `Expected a Node.js Buffer.`)
    this.#buffer = buffer
  }

  get data() { return this.#buffer }
}
