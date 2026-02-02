export const myExtensionsPojo = {
  isAbstract: true,
  isAnonymous: true,
  members: {
    methods: {
      myMethod: { host: '.' },
      myAbstractMethod: { host: '.', isAbstract: true },
      myLambda: { host: '.' }
    },
    getters: {
      myGetter: { host: '.' },
      myAbstractGetter: { host: '.', isAbstract: true },
      myOddGetter: { modifiers: [ 'sealed', 'visible' ], host: '.' }
    },
    setters: {
      mySetter: { host: '.' },
      myAbstractSetter: { host: '.', isAbstract: true }
    },
    properties: {
      myProperty: { host: '.' },
      myAbstractProperty: { host: '.', isAbstract: true }
    },
    fields: {
      myField: { host: '.', fieldType: 'number' },
      myConstant: {
        modifiers: [ 'sealed', 'const' ],
        host: '.',
        fieldType: 'number'
      },
      myClassField: { host: '.', fieldType: 'class' }
    }
  }
}