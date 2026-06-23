import { overload } from '@kingjs/function-contract'
import { NormalNumber } from '@kingjs/simple-type'
import {
  BacktrackableCursorShape,
  RandomAccessCursorShape,
} from '@kingjs/cursor-shape'

export const retreat = overload([
  BacktrackableCursorShape,
  NormalNumber,
], [
  {
    when: [ RandomAccessCursorShape ],
    use: function retreatRandomAccess(cursor, count) {
      return cursor.move(-count)
    },
  },
],
function retreat(cursor, count, until = null) {
  for (
    let i = 0;
    i < count && (until == null || !cursor.equals(until));
    i++
  )
    cursor.stepBack()

  return cursor
})
