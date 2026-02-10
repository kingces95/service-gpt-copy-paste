import fs from 'fs'
import { ClassInfo } from "@kingjs/info"
import { } from "@kingjs/info-to-pojo"

import {
  IntervalConcept,
  CursorConcept,
  InputCursorConcept,
  OutputCursorConcept,
  ForwardCursorConcept,
  BidirectionalCursorConcept,
  RandomAccessCursorConcept,
  ContiguousCursorConcept,
  CursorFactoryConcept,

  Cursor,
  Range,
} from "@kingjs/cursor"

import {
  ContainerConcept,
  InputContainerConcept,
  OutputContainerConcept,
  ForwardContainerConcept,
  BidirectionalContainerConcept,
  RandomAccessContainerConcept,
  ContiguousContainerConcept,

  SequenceContainerConcept,
  RewindContainerConcept,
  IndexableContainerConcept,
  PrologContainerConcept,

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
// dumpToFile(InputCursorConcept, 'input-cursor-concept')
// dumpToFile(OutputCursorConcept, 'output-cursor-concept')
// dumpToFile(ForwardCursorConcept, 'forward-cursor-concept')
// dumpToFile(BidirectionalCursorConcept, 'bidirectional-cursor-concept')
// dumpToFile(RandomAccessCursorConcept, 'random-access-cursor-concept')
// dumpToFile(ContiguousCursorConcept, 'contiguous-cursor-concept')

// dumpToFile(Cursor, 'cursor')
// dumpToFile(CursorFactoryConcept, 'cursor-factory-concept')
// dumpToFile(Range, 'range')
// dumpToFile(IntervalConcept, 'interval-concept')

// dumpToFile(ContainerConcept, 'container-concept')
// dumpToFile(InputContainerConcept, 'input-container-concept')
// dumpToFile(OutputContainerConcept, 'output-container-concept')
// dumpToFile(ForwardContainerConcept, 'forward-container-concept')
// dumpToFile(BidirectionalContainerConcept, 'bidirectional-container-concept')
// dumpToFile(RandomAccessContainerConcept, 'random-access-container-concept')
// dumpToFile(ContiguousContainerConcept, 'contiguous-container-concept')
// dumpToFile(SequenceContainerConcept, 'sequence-container-concept')
// dumpToFile(RewindContainerConcept, 'rewind-container-concept')
// dumpToFile(IndexableContainerConcept, 'indexable-container-concept')
// dumpToFile(PrologContainerConcept, 'prolog-container-concept')

// dumpToFile(ContainerCursor, 'container-cursor')
// dumpToFile(SequenceCursor, 'sequence-cursor')
// dumpToFile(RewindCursor, 'rewind-cursor')
// dumpToFile(IndexableCursor, 'indexable-cursor')
// dumpToFile(ContiguousCursor, 'contiguous-cursor')