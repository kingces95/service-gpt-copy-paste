export const objectPojo = {
  name: 'Object',
  members: {
    static: {
      __known: {
        methods: {
          assign: { host: '.' },
          getOwnPropertyDescriptor: { host: '.' },
          getOwnPropertyDescriptors: { host: '.' },
          getOwnPropertyNames: { host: '.' },
          getOwnPropertySymbols: { host: '.' },
          hasOwn: { host: '.' },
          is: { host: '.' },
          preventExtensions: { host: '.' },
          seal: { host: '.' },
          create: { host: '.' },
          defineProperties: { host: '.' },
          defineProperty: { host: '.' },
          freeze: { host: '.' },
          getPrototypeOf: { host: '.' },
          setPrototypeOf: { host: '.' },
          isExtensible: { host: '.' },
          isFrozen: { host: '.' },
          isSealed: { host: '.' },
          keys: { host: '.' },
          entries: { host: '.' },
          fromEntries: { host: '.' },
          values: { host: '.' },
          groupBy: { host: '.' }
        },
        fields: {
          length: { modifiers: [ 'const', 'hidden' ], host: '.' },
          name: { modifiers: [ 'const', 'hidden' ], host: '.' },
          prototype: { modifiers: [ 'sealed', 'const', 'hidden' ], host: '.' }
        }
      }
    },
    instance: {
      __known: {
        __nonPublic: {
          methods: {
            __defineGetter__: { host: '.' },
            __defineSetter__: { host: '.' },
            __lookupGetter__: { host: '.' },
            __lookupSetter__: { host: '.' }
          }
        },
        constructor: { constructor: { host: '.' } },
        methods: {
          hasOwnProperty: { host: '.' },
          isPrototypeOf: { host: '.' },
          propertyIsEnumerable: { host: '.' },
          toString: { host: '.' },
          valueOf: { host: '.' },
          toLocaleString: { host: '.' }
        }
      }
    }
  }
}
