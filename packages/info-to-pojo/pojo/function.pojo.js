export const functionPojo = {
  name: 'Function',
  base: 'Object',
  members: {
    static: {
      __known: {
        methods: {
          prototype: {
            type: 'method',
            host: 'Function',
            isConfigurable: false,
            rootHost: 'Object',
            isWritable: false
          }
        },
        data: {
          length: {
            type: 'data',
            host: 'Function',
            rootHost: 'Object',
            isWritable: false,
            isEnumerable: false
          },
          name: {
            type: 'data',
            host: 'Function',
            rootHost: 'Object',
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
        methods: {
          constructor: { type: 'method', host: 'Function', rootHost: 'Object' },
          apply: { type: 'method', host: 'Function' },
          bind: { type: 'method', host: 'Function' },
          call: { type: 'method', host: 'Function' },
          toString: { type: 'method', host: 'Function', rootHost: 'Object' },
          hasOwnProperty: { type: 'method', host: 'Object' },
          isPrototypeOf: { type: 'method', host: 'Object' },
          propertyIsEnumerable: { type: 'method', host: 'Object' },
          valueOf: { type: 'method', host: 'Object' },
          toLocaleString: { type: 'method', host: 'Object' },
          [Symbol.hasInstance]: {
            type: 'method',
            host: 'Function',
            isConfigurable: false,
            isWritable: false
          }
        },
        data: {
          length: {
            type: 'data',
            host: 'Function',
            isWritable: false,
            isEnumerable: false
          },
          name: {
            type: 'data',
            host: 'Function',
            isWritable: false,
            isEnumerable: false
          }
        },
        accessors: {
          arguments: {
            type: 'accessor',
            host: 'Function',
            hasGetter: true,
            hasSetter: true
          },
          caller: {
            type: 'accessor',
            host: 'Function',
            hasGetter: true,
            hasSetter: true
          }
        }
      }
    }
  }
}