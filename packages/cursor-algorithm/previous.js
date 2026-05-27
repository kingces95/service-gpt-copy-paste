import { contract } from '@kingjs/function-contract'
import { NormalNumber } from '@kingjs/simple-type'
import { BidirectionalCursorShape } from '@kingjs/cursor-shape'

import { rewind } from './bidirectional/rewind.js'

export const previous = contract([
  BidirectionalCursorShape,
  NormalNumber,
], [ undefined, 1 ],
function previous(cursor, count = 1) {
  return rewind(cursor.clone(), count)
})
