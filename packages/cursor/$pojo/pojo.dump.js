import fs from 'fs'
import { ClassInfo } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"

import {
  IntervalConcept,
  CursorConcept,
} from "@kingjs/cursor"

import {
  BidirectionalCursorShape,
  ContiguousCursorShape,
  CursorShape,
  ForwardCursorShape,
  InputCursorShape,
  OutputCursorShape,
  RandomAccessCursorShape,
  WritableContiguousCursorShape,
  WritableRandomAccessCursorShape,
} from "@kingjs/cursor-shape"

import {
  ContainerPart,

  FrontEditableContainerPart,
  BackEditableContainerPart,
  IndexableContainerPart,

  ContainerCursor,
  SequenceCursor,
  RewindCursor,
  IndexableCursor,
  ContiguousCursor,
} from "@kingjs/cursor-container"

import util from 'node:util'

function consoleString(x) {
  return util.inspect(x, { depth: null })
}

const pathOfThisFile = new URL('', import.meta.url).pathname

async function dumpToFile(fn, relPath) {
  const fnInfo = ClassInfo.from(fn)
  const pojo = await fnInfo.toPojo({
  })

  const path = new URL(relPath, import.meta.url).pathname.substring(1)
  // const content = JSON.stringify(pojo, null, 2)
  // use util inteadd of fs to avoid ESM issues
  const content = 'export default _ = ' + consoleString(pojo)
  fs.writeFileSync(path + '.js', content)
}

function dump(fn) {
  const fnInfo = ClassInfo.from(fn)
  fnInfo.dump({
    ownOnly: false,
    isNonPublic: false,
  })
}

// dumpToFile(CursorConcept, 'cursor-concept')
// dumpToFile(CursorShape, 'cursor-shape')
// dumpToFile(InputCursorShape, 'input-cursor-shape')
// dumpToFile(OutputCursorShape, 'output-cursor-shape')
// dumpToFile(ForwardCursorShape, 'forward-cursor-shape')
// dumpToFile(BidirectionalCursorShape, 'bidirectional-cursor-shape')
// dumpToFile(RandomAccessCursorShape, 'random-access-cursor-shape')
// dumpToFile(WritableRandomAccessCursorShape, 'writable-random-access-cursor-shape')
// dumpToFile(ContiguousCursorShape, 'contiguous-cursor-shape')
// dumpToFile(WritableContiguousCursorShape, 'writable-contiguous-cursor-shape')

// dumpToFile(IntervalConcept, 'interval-concept')

// dumpToFile(ContainerPart, 'container-concept')
// dumpToFile(FrontEditableContainerPart, 'sequence-container-concept')
// dumpToFile(BackEditableContainerPart, 'rewind-container-concept')
// dumpToFile(IndexableContainerPart, 'indexable-container-concept')

// dumpToFile(ContainerCursor, 'container-cursor')
// dumpToFile(SequenceCursor, 'sequence-cursor')
// dumpToFile(RewindCursor, 'rewind-cursor')
// dumpToFile(IndexableCursor, 'indexable-cursor')
// dumpToFile(ContiguousCursor, 'contiguous-cursor')
