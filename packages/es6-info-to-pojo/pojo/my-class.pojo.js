const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassPojo = {
  name: 'MyClass',
  base: 'MyBase',
  members: {
    static: {
      methods: {
        myStaticMethod: { type: 'method', host: 'MyClass' },
        myStaticBaseMethod: { type: 'method', host: 'MyBase' },
        [MyStaticSymbol]: { type: 'method', host: 'MyClass' }
      },
      accessors: {
        myStaticAccessor: {
          type: 'accessor',
          host: 'MyClass',
          hasGetter: true,
          hasSetter: true
        }
      }
    },
    instance: {
      methods: {
        myMethod: { type: 'method', host: 'MyClass' },
        myBaseMethod: { type: 'method', host: 'MyBase' },
        myFunkyMethod: {
          type: 'method',
          host: 'MyBase',
          isConfigurable: false,
          isWritable: false
        },
        [MySymbol]: { type: 'method', host: 'MyClass' }
      },
      accessors: {
        myAccessor: {
          type: 'accessor',
          host: 'MyClass',
          hasGetter: true,
          hasSetter: true
        }
      }
    }
  },
}
