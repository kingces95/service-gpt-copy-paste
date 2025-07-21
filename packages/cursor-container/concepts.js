import { Concept, Stub } from '@kingjs/concept'
import { Preconditions } from '@kingjs/debug-proxy'
import {
  throwNull,
  throwNotEquatableTo,
} from '@kingjs/cursor'

// Prolog containers implement a beforeBegin iterator. A beforeBegin 
// cursor is used for implementing insertAfter and removeAfter methods.
export class PrologContainer extends Concept {
  get beforeBegin() { return this[Stub](
    BeforeBeginContainer, 'beforeBegin') }
  insertAfter(cursor, value) { return this[Stub](
    BeforeBeginContainer, 'insertAfter', cursor, value) }
  removeAfter(cursor) { return this[Stub](
    BeforeBeginContainer, 'removeAfter', cursor) }
}

