import { contract } from '@kingjs/function-contract'
import { NormalNumber } from '@kingjs/cursor'
import { ForwardCursorShape } from '@kingjs/cursor-shape'

import { advance } from './advance.js'

export const next = contract([
  ForwardCursorShape,
  NormalNumber,
], [ undefined, 1 ],
function next(cursor, count = 1) {
  return advance(cursor.clone(), count)
})
