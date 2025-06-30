import { SequenceContainer } from '../sequence-container.js'
import { ContiguousCursor } from './contiguous-cursor.js'

// Contiguous Container is an abstract class that represents a range
// of memory or "contiguous bytes". Memory implies operations beyond that
// of a sequence container, such as the ability to decode to a number in 
// a signle operation given an offset, sign, length in bytes, and endianness.

// Operations:
// - data: returns a Node Buffer which can be used to decode primitives.
// - offset: returns the offset into the data buffer where the container starts.
export class ContiguousContainer extends SequenceContainer {
  static get Cursor() { return ContiguousCursor }
}
