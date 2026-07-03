import { initialize } from '@kingjs/partial-class'
import { compose } from '@kingjs/partial-compose'
import { PartialProxy } from '@kingjs/partial-proxy'
import { ProjectedRangeContainerPart } from '../part/projected-range-container-part.js'
import { RangeContainerPart } from '../part/range-container-part.js'
import { ProjectedCursor } from '../cursor/projected-cursor.js'

// ProjectedRangeContainer scans a source range as projected values while
// preserving source ownership. Cursors move in projected space, but
// popRangeAt() returns the source ranges that produced the committed prefix.
//
export class ProjectedRangeContainer extends PartialProxy {
  static cursorType = ProjectedCursor

  constructor(source) {
    super()
    const cursorType = this.constructor.cursorType
    initialize(this, ProjectedRangeContainerPart, cursorType, source)
  }

  static {
    compose(this, ProjectedRangeContainerPart, { }, {
      decodeValue$(sourceCursor) { },
    })

    compose(this, RangeContainerPart, {
      get bytesPopped() { return this.source$.bytesPopped },
      get bytesPushed() { return this.source$.bytesPushed },

      pushRange(range) {
        this.source$.pushRange(range)
        return this
      },

      popRangeAt(cursor = this.end()) {
        return this.source$.popRangeAt(cursor.sourceCursor$)
      },

      popRange$(needle, options) {
        return this.source$.popRange(needle, options)
      },

      ranges() { return this.source$.ranges() },
    })
  }
}
