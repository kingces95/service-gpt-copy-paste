const MySymbol = Symbol.for('my-symbol')

export const myClassInstancePojo = {
  name: 'MyClass',
  base: 'MyBase',
  members: {
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
