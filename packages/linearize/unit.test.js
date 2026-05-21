import { describe, it, expect } from 'vitest'
import { linearize } from '@kingjs/linearize'

// A
// ├─ ARight
// │  └─ Base
// └─ ALeft
//    └─ Base
//
// B
// └─ BMid
//    └─ Base

const Edges = {
  A: [ 'ALeft', 'ARight' ],
  ARight: [ 'Base' ],
  ALeft: [ 'Base' ],
  Base: [ ],
  B: [ 'BMid' ],
  BMid: [ 'Base' ],
}

function adjacent(node) {
  return Edges[node] ?? [ ]
}

describe('linearize', () => {
  it('should linearize a root', () => {
    const actual = [...linearize('A', adjacent)]
    expect(actual).toEqual([ 'Base', 'ALeft', 'ARight', 'A' ])
  })
  it('should linearize a root in preorder', () => {
    const actual = [...linearize('A', adjacent, { preOrder: true })]
    expect(actual).toEqual([ 'A', 'ALeft', 'Base', 'ARight' ])
  })
  it('should reverse adjacent nodes', () => {
    const actual = [...linearize('A', adjacent, { reverse: true })]
    expect(actual).toEqual([ 'Base', 'ARight', 'ALeft', 'A' ])
  })
  it('should linearize a forest with one visited set', () => {
    const actual = [...linearize([ 'A', 'B' ], adjacent)]
    expect(actual).toEqual([ 'Base', 'ALeft', 'ARight', 'A', 'BMid', 'B' ])
  })
  it('should reverse forest roots and adjacent nodes', () => {
    const actual = [...linearize([ 'A', 'B' ], adjacent, { reverse: true })]
    expect(actual).toEqual([ 'Base', 'BMid', 'B', 'ARight', 'ALeft', 'A' ])
  })
  it('should linearize a forest in preorder', () => {
    const actual = [...linearize([ 'A', 'B' ], adjacent, {
      preOrder: true,
    })]
    expect(actual).toEqual([ 'A', 'ALeft', 'Base', 'ARight', 'B', 'BMid' ])
  })
  it('should linearize a forest in reversed preorder', () => {
    const actual = [...linearize([ 'A', 'B' ], adjacent, {
      preOrder: true,
      reverse: true,
    })]
    expect(actual).toEqual([ 'B', 'BMid', 'Base', 'A', 'ARight', 'ALeft' ])
  })
})
