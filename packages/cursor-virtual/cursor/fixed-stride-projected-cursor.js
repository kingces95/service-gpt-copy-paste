import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { distance, previous } from '@kingjs/cursor-algorithm'
import { ProjectedCursor } from './projected-cursor.js'
import {
  FixedStridePageContainer,
} from '../container/fixed-stride-page-container.js'

const pages = ProjectedCursor.prototype.pages

export class FixedStrideProjectedCursor extends ProjectedCursor {
  static {
    define(this, {
      get stride$() { return this.container._strideLength },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() {
        return this.sourceCursor$.equals(this.container.source$.begin())
      },

      stepBack() {
        this._sourceCursor = previous(
          this.sourceCursor$,
          this.container._strideLength
        )
        return this
      },
    })

    define(this, {
      *pages(other) {
        let modulus = 0

        for (const sourcePage of pages.call(this, other)) {
          const pageModulus = modulus
          const page = new FixedStridePageContainer(
            sourcePage,
            {
              modulus: pageModulus,
              strideLength: this.container._strideLength,
            }
          )

          yield page

          modulus = (modulus + distance(sourcePage)) %
            this.container._strideLength
        }
      },
    })
  }
}
