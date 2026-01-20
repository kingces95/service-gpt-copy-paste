const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassPojo = {
  name: 'MyClass',
  base: 'MyBase',
  staticMembers: {
    methods: {
      myStaticMethod: { host: '.' },
      myStaticBaseMethod: { host: 'MyBase' },
      [MyStaticSymbol]: { host: '.' }
    },
    properties: { myStaticAccessor: { host: '.' } }
  },
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
