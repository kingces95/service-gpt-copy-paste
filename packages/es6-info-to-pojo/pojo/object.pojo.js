export const objectPojo = {
  name: 'Object',
  members: {
    static: {
      __known: {
        methods: {
          assign: { type: 'method', host: 'Object' },
          getOwnPropertyDescriptor: { type: 'method', host: 'Object' },
          getOwnPropertyDescriptors: { type: 'method', host: 'Object' },
          getOwnPropertyNames: { type: 'method', host: 'Object' },
          getOwnPropertySymbols: { type: 'method', host: 'Object' },
          hasOwn: { type: 'method', host: 'Object' },
          is: { type: 'method', host: 'Object' },
          preventExtensions: { type: 'method', host: 'Object' },
          seal: { type: 'method', host: 'Object' },
          create: { type: 'method', host: 'Object' },
          defineProperties: { type: 'method', host: 'Object' },
          defineProperty: { type: 'method', host: 'Object' },
          freeze: { type: 'method', host: 'Object' },
          getPrototypeOf: { type: 'method', host: 'Object' },
          setPrototypeOf: { type: 'method', host: 'Object' },
          isExtensible: { type: 'method', host: 'Object' },
          isFrozen: { type: 'method', host: 'Object' },
          isSealed: { type: 'method', host: 'Object' },
          keys: { type: 'method', host: 'Object' },
          entries: { type: 'method', host: 'Object' },
          fromEntries: { type: 'method', host: 'Object' },
          values: { type: 'method', host: 'Object' },
          groupBy: { type: 'method', host: 'Object' }
        },
        data: {
          length: {
            type: 'data',
            host: 'Object',
            isWritable: false,
            isEnumerable: false
          },
          name: {
            type: 'data',
            host: 'Object',
            isWritable: false,
            isEnumerable: false
          },
          prototype: {
            type: 'data',
            host: 'Object',
            isConfigurable: false,
            isWritable: false,
            isEnumerable: false
          }
        }
      }
    },
    instance: {
      __known: {
        __nonPublic: {
          methods: {
            __defineGetter__: { type: 'method', host: 'Object' },
            __defineSetter__: { type: 'method', host: 'Object' },
            __lookupGetter__: { type: 'method', host: 'Object' },
            __lookupSetter__: { type: 'method', host: 'Object' }
          }
        },
        constructor: {
          constructor: { type: 'constructor', host: 'Object' },
        },
        methods: {
          hasOwnProperty: { type: 'method', host: 'Object' },
          isPrototypeOf: { type: 'method', host: 'Object' },
          propertyIsEnumerable: { type: 'method', host: 'Object' },
          toString: { type: 'method', host: 'Object' },
          valueOf: { type: 'method', host: 'Object' },
          toLocaleString: { type: 'method', host: 'Object' }
        }
      }
    }
  },
}
