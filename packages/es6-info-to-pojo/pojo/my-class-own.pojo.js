const MySymbol = Symbol.for('my-symbol')
const MyStaticSymbol = Symbol.for('my-static-symbol')

export const myClassOwnPojo = {
  name: 'MyClass',
  base: 'MyBase',
  ownMembers: {
    static: {
      methods: {
        myStaticMethod: { host: '.' },
        [MyStaticSymbol]: { host: '.' }
      },
      properties: { myStaticAccessor: { host: '.' } }
    },
    instance: {
      methods: { myMethod: { host: '.' }, [MySymbol]: { host: '.' } },
      properties: { myAccessor: { host: '.' } }
    }
  }
}