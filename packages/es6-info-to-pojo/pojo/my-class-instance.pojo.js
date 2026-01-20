const MySymbol = Symbol.for('my-symbol')

export const myClassInstancePojo = {
  name: 'MyClass',
  base: 'MyBase',
  members: {
    methods: {
      myMethod: { host: '.' },
      myBaseMethod: { host: 'MyBase' },
      myFunkyMethod: { modifiers: [ 'sealed', 'const' ], host: 'MyBase' },
      [MySymbol]: { host: '.' }
    },
    properties: { myAccessor: { host: '.' } }
  }
}
