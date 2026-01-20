const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassStaticPojo = {
  name: 'MyClass',
  base: 'MyBase',
  staticMembers: {
    methods: {
      myStaticMethod: { host: '.' },
      myStaticBaseMethod: { host: 'MyBase' },
      [MyStaticSymbol]: { host: '.' }
    },
    properties: { myStaticAccessor: { host: '.' } }
  }
}
