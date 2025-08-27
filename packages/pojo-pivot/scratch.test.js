import util from 'util'
import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { pivotPojos } from '@kingjs/pojo-pivot'

const typePivotMd = {
  methods: { type: 'method' },
  data: { type: 'data' },
  accessors: { type: 'accessor' },      
}
const nonPublicPivotMd = {
  __nonPublic: {
    predicate: 'isNonPublic', 
    pivot: typePivotMd,
  },
  ...typePivotMd
}
const knownPivotMd = {
  __known: { 
    predicate: 'isKnown', 
    pivot: nonPublicPivotMd,
  },
  ...nonPublicPivotMd
}
const staticPivotMd = {
  __static: {
    predicate: 'isStatic', 
    pivot: knownPivotMd,
  },
  __instance: {
    pivot: knownPivotMd
  }
}

describe('Rows of pojos ala reflection info', () => {
  let infos
  beforeEach(() => {
    infos = [
      // unknown, public, instance
      { name: 'method', type: 'method' },
      { name: 'data', type: 'data' },
      { name: 'accessor', type: 'accessor', hasGetter: true },

      // unknonwn, non-public, instance
      { name: '_method', 
        type: 'method', isNonPublic: true },

      // unknown, public, static
      { name: 'staticMethod', 
        type: 'method', isStatic: true },

      // unknown, non-public, static
      { name: '_staticMethod', 
        type: 'method', isStatic: true, isNonPublic: true },

      // known, public, instance
      { name: 'knownMethod', 
        type: 'method', isKnown: true },

      // known, non-public, instance
      { name: '_knownMethod', 
        type: 'method', isKnown: true, isNonPublic: true },

      // known, public, static
      { name: 'knownStaticMethod', 
        type: 'method', isKnown: true, isStatic: true },

      // known, non-public, static
      { name: '_knownStaticMethod', 
        type: 'method', isKnown: true, isStatic: true, isNonPublic: true },
    ]
  })

  describe('pivoted with metadata', () => {
    let result
    beforeEach(() => {
      result = pivotPojos(infos, staticPivotMd)
    })

    it('should match expected format', () => {
      const expected = {
        __static: {
          __known: {
            __nonPublic: {
              methods: { _knownStaticMethod: { type: 'method' } }
            },
            methods: { knownStaticMethod: { type: 'method' } }
          },
          __nonPublic: {
            methods: { _staticMethod: { type: 'method' } }
          },
          methods: { staticMethod: { type: 'method' } }
        },
        __instance: {
          __known: {
            __nonPublic: {
              methods: { _knownMethod: { type: 'method' } }
            },
            methods: { knownMethod: { type: 'method' } }
          },
          __nonPublic: {
            methods: { _method: { type: 'method' } }
          },
          methods: { method: { type: 'method' } },
          data: { data: { type: 'data' } },
          accessors: { accessor: { type: 'accessor', hasGetter: true } }
        }
      }
      //console.log(result)
      //console.log(util.inspect(result, { depth: null, colors: true }))
      expect(result).toEqual(expected)
    })
  })
})