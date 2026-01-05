import util from 'util'
import { describe, it, expect } from 'vitest'
import { beforeEach } from 'vitest'
import { pivotPojos } from '@kingjs/pojo-pivot'

const typePivotMd = {
  methods: { discriminator: 'method' },
  data: { discriminator: 'data' },
  accessors: { discriminator: 'accessor' },      
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

    // add `host: '.'` to each info
    for (const info of infos)
      info.host = '.'
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
              methods: { _knownStaticMethod: { host: '.' } }
            },
            methods: { knownStaticMethod: { host: '.' } }
          },
          __nonPublic: {
            methods: { _staticMethod: { host: '.' } }
          },
          methods: { staticMethod: { host: '.' } }
        },
        __instance: {
          __known: {
            __nonPublic: {
              methods: { _knownMethod: { host: '.' } }
            },
            methods: { knownMethod: { host: '.' } }
          },
          __nonPublic: {
            methods: { _method: { host: '.' } }
          },
          methods: { method: { host: '.' } },
          data: { data: { host: '.' } },
          accessors: { accessor: { host: '.', hasGetter: true } }
        }
      }
      //console.log(result)
      //console.log(util.inspect(result, { depth: null, colors: true }))
      expect(result).toEqual(expected)
    })
  })
})