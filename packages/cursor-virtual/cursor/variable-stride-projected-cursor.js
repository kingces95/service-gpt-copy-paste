import { compose } from '@kingjs/partial-compose'
import { define } from '@kingjs/partial-define'
import { BacktrackableCursorPart } from '@kingjs/cursor'
import { ProjectedCursor } from './projected-cursor.js'
import {
  VariableStridePageContainer,
} from '../container/variable-stride-page-container.js'

const pages = ProjectedCursor.prototype.pages

export class VariableStrideProjectedCursor extends ProjectedCursor {
  static {
    define(this, {
      get stride$() {
        if (this.sourceCursor$.equals(this.container.source$.end()))
          return null

        return this.container.tokenStrideOf$(this.sourceCursor$.value)
      },

      *pages(other) {
        for (const sourcePage of pages.call(this, other)) {
          const page = new VariableStridePageContainer(
            sourcePage,
            {
              isContinuation: value =>
                this.container._isContinuation(value),
            }
          )

          yield page
        }
      },
    })

    compose(this, BacktrackableCursorPart, {
      isAtBegin$() {
        return this.sourceCursor$.equals(this.container.source$.begin())
      },

      stepBack() {
        this.sourceCursor$.stepBack()

        while (this.container._isContinuation(this.sourceCursor$.value))
          this.sourceCursor$.stepBack()

        return this
      },
    })
  }
}
