export const functionPojo = {
  name: 'Function',
  base: 'Object',
  members: {
    static: {
      __known: {
        methods: { prototype: { modifiers: [ 'sealed', 'const' ], host: '.' } },
        fields: {
          length: { modifiers: [ 'const', 'hidden' ], host: '.' },
          name: { modifiers: [ 'const', 'hidden' ], host: '.' }
        }
      }
    },
    instance: {
      __known: {
        __nonPublic: {
          methods: {
            __defineGetter__: { host: 'Object' },
            __defineSetter__: { host: 'Object' },
            __lookupGetter__: { host: 'Object' },
            __lookupSetter__: { host: 'Object' }
          }
        },
        constructor: { constructor: { host: '.' } },
        methods: {
          apply: { host: '.' },
          bind: { host: '.' },
          call: { host: '.' },
          toString: { host: '.' },
          hasOwnProperty: { host: 'Object' },
          isPrototypeOf: { host: 'Object' },
          propertyIsEnumerable: { host: 'Object' },
          valueOf: { host: 'Object' },
          toLocaleString: { host: 'Object' },
          [Symbol.hasInstance]: { modifiers: [ 'sealed', 'const' ], host: '.' }
        },
        properties: { arguments: { host: '.' }, caller: { host: '.' } },
        fields: {
          length: { modifiers: [ 'const', 'hidden' ], host: '.' },
          name: { modifiers: [ 'const', 'hidden' ], host: '.' }
        }
      }
    }
  }
}
