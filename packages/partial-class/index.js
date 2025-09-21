import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Descriptor } from '@kingjs/descriptor'
import { Compiler } from '@kingjs/compiler'
import { isPojo } from '@kingjs/pojo-test'
import { asArray } from '@kingjs/as-array'
import { getOwn } from '@kingjs/get-own'

const {
  get: getDescriptor,
} = Descriptor

const {
  isExtensionOf,
  memberNamesAndSymbols,
} = Reflection

// An PartialClass can define a number of static hooks. Each hook has its 
// own symbol: Compile, Bind, PreCondition, and PostCondition.  

// Compile allows the PartialClass to apply custom policy to the descriptors
// after they have been compiled by Compiler. For example, a concept
// partial type can apply a policy that all its members are "abstract" by
// setting all get/set/value to abstract for non-data members. Compile is 
// called with the descriptor and returns a descriptor.

// Bind allows the PartialClass to apply custom policy to the compiled descriptors. 
// Bind is called with the type, name, and descriptor and returns a descriptor. 
// If Bind returns null, then the member is not defined on the type prototype.
// Concept will return null if the member is already defined on the type prototype.

// PreCondition allows the PartialClass to enforce a pre condition before any
// members are applied. This is not guaranteed to be called if a non-debug 
// version of the code is used. PreCondition is called with the type 
// and returns void.

// PostCondition allows the PartialClass to enforce a post condition after the
// partial type as been applied. This is not guaranteed to be called if
// a non-debug version of the code is used. PostCondition is called with
// the type and returns void.
export const Compile = Symbol('Compile')
export const Bind = Symbol('Bind')
export const PreCondition = Symbol('PreCondition')
export const PostCondition = Symbol('PostCondition')
export const OwnDeclarations = Symbol('OwnDeclarations')

// Declarations is a map set on a client type to track which partial types
// have been applied to it via PartialClass.define indirectly via
// calls to either extend() or implement(). 
const Declarations = Symbol('Declarations')

export class PartialClass {

  static *getOwnDeclarations(type) {
    const declarations = getOwn(type, Declarations)
    if (!declarations) return
    for (const definition of declarations) {
      if (!isExtensionOf(definition, this))
        continue
      yield definition
    }
  }

  static fromArg(arg) {
    if (isPojo(arg))
      arg = Extension.fromPojo(arg)

    assert(isExtensionOf(arg, PartialClass),
      `Expected arg to be a PartialClass.`)

    return arg
  }

  constructor() {
    throw new TypeError('PartialClass cannot be instantiated.')
  }

  static *fromDeclaration$(symbol, expectedType = PartialClass) {
    const declarations = asArray(getOwn(this, symbol))

    for (const declaration of declarations.map(PartialClass.fromArg)) {
      assert(isExtensionOf(declaration, expectedType),
        `Expected declaration to be a ${expectedType.name} extension.`)

      yield declaration
    }
  }

  static *[OwnDeclarations]() { }
  static [Compile](descriptor) { return Compiler.compile(descriptor) }
  static [Bind](type, name, descriptor) { return descriptor }
  static [PreCondition](type, host) { }
  static [PostCondition](type) { }

  static *declarations(visited = new Set()) {
    for (const child of this.ownDeclarations()) {
      if (visited.has(child)) continue
      visited.add(child)
      
      yield child
      yield* child.declarations(visited)
    }
  }
  static *ownDeclarations() {
    yield* this[OwnDeclarations]()
  }

  static *namesAndSymbols(visited = new Set()) { 
    for (const name of this.ownNamesAndSymbols()) {
      if (visited.has(name)) continue
      visited.add(name)
      yield name
    }

    for (const concept of this.declarations()) {
      if (!isExtensionOf(concept, this))
        continue
      yield* concept.namesAndSymbols(visited)
    }
  }
  static *ownNamesAndSymbols() { 
    yield* memberNamesAndSymbols(this.prototype) 
  }

  static define(type) {
    assert(!(isExtensionOf(type, PartialClass)),
      `Expected type '${type.name}' not to be a PartialClass.`)

    this[PreCondition](type)

    // fetch, compile, bind, and define properties on the type prototype
    const typePrototype = type.prototype
    const partialTypePrototype = this.prototype
    for (const key of memberNamesAndSymbols(partialTypePrototype)) {
      const definition = getDescriptor(partialTypePrototype, key)
      const descriptor = this[Compile](definition)
      const boundDescriptor = this[Bind](type, key, descriptor)
      if (!boundDescriptor) continue
      Object.defineProperty(typePrototype, key, boundDescriptor)
    }

    for (const declaration of this.declarations())
      declaration.define(type)

    // record that this partial type has been applied to the type
    const declarations = getOwn(type, Declarations) || new Set()
    declarations.add(this)
    Object.defineProperty(type, Declarations, {
      value: declarations,
      configurable: true,
    })

    this[PostCondition](type)
  }
}

export const Extensions = Symbol('Extensions')

export class Extension extends PartialClass {
  static *[OwnDeclarations]() { 
    yield *this.fromDeclaration$(Extensions)
  }

  static fromPojo(pojo) {
    assert(isPojo(pojo))

    // define an anonymous extension
    const [anonymousExtension] = [class extends Extension { }]
    const prototype = anonymousExtension.prototype
    
    // copy descriptors from pojo to anonymous extension prototype
    for (const name of memberNamesAndSymbols(pojo)) {
      const descriptor = getDescriptor(pojo, name)
      Object.defineProperty(prototype, name, descriptor)
    }

    return anonymousExtension
  }
}