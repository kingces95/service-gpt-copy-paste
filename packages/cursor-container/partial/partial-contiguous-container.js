import { assert } from '@kingjs/assert'
import { extend } from '@kingjs/partial-extend'
import { Preconditions } from '@kingjs/partial-proxy'
import {
  OutputRangeConcept,
  ContiguousRangeConcept,
} from '@kingjs/cursor'
import {
  FrontEditableContainerPart,
  BackEditableContainerPart,
  SizedContainerPart,
  IndexableContainerPart,
  ReservableContainerPart,
  ByteContainerPart,
} from '../container-parts.js'
import { ContiguousCursor } from '../cursor/contiguous-cursor.js'
import { PartialIndexableContainer } from './partial-indexable-container.js'
import { implement } from '@kingjs/partial-implement'

export class PartialContiguousContainer extends PartialIndexableContainer {
    static cursorType = ContiguousCursor

    static [Preconditions] = {
      span(begin = this.begin(), end = this.end()) {
        const { index: beginIndex } = begin
        const { index: endIndex } = end
        assert(beginIndex >= 0, 
          `Cannot read at negative index: ${beginIndex}.`)
        assert(endIndex <= this.size, 
          `Cannot read at index ${endIndex}.`)        
      },
      insert(begin, end) { 
        return
      },
      eraseAt(begin, end) { 
        return
      }
    }

    static {
      implement(this, ContiguousRangeConcept)

      extend(this, IndexableContainerPart, { 
        // none
      }, {
        at(index) { },
        setAt(index, value) { },
      })

      extend(this, SizedContainerPart, { 
        // none
      }, {
        get size() { return this._count }
      })

      extend(this, ReservableContainerPart, {
        // none
      }, {
        get capacity() { },
        setCapacity(count) { },
      })

      extend(this, ByteContainerPart, {
        // none
      }, {
        span(index, other) { },
      })
    }
  }