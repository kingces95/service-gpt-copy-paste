const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassStaticPojo = {
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
  },
}
