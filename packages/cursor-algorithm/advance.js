import { overload } from '@kingjs/function-contract'
import { NormalNumber } from '@kingjs/cursor'
import {
  ForwardCursorShape,
  RandomAccessCursorShape,
} from '@kingjs/cursor-shape'

export const advance = overload([
  ForwardCursorShape,
  NormalNumber,
], [
  {
    when: [ RandomAccessCursorShape ],
    use: function advanceRandomAccess(cursor, count) {
      return cursor.move(count)
    },
  },
],
function advance(cursor, count) {
  for (let i = 0; i < count; i++)
    cursor.step()

  return cursor
})
