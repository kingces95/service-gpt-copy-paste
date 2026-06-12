import { define } from '@kingjs/partial-define'
import { genericType } from '@kingjs/generic'
import { VirtualCursorOf } from './virtual-cursor.js'

export const VariableStrideVirtualCursorOf = genericType(TSpan => {
  const VirtualCursor = VirtualCursorOf(TSpan)

  return class VariableStrideVirtualCursor extends VirtualCursor {
    static {
      define(this, {
        get stride$() {
          if (this.sourceCursor$.equals(this.container.source$.end()))
            return null

          return this.container.tokenStrideOf$(this.sourceCursor$.value)
        },
      })
    }
  }
})

export const VariableStrideVirtualCursor = VariableStrideVirtualCursorOf(Object)
