import { assert } from '@kingjs/assert'
import { Reflection } from '@kingjs/reflection'
import { Compiler } from '@kingjs/compiler'

const {
  ownMemberNamesAndSymbols,
  associatedTypes,
  addAssociatedType,
  associatedKeys,
} = Reflection

// A PartialClass can define a number of static hooks. Each hook has its 
// own symbol: Compile, Bind, PreCondition, and PostCondition.  

// Compile transforms a descriptor before being copied to the target type. 
// For example, a concept partial type can apply a policy that all its 
// members are "abstract" by setting all get/set/value to abstract for 
// non-data members. Compile is called with the descriptor and returns 
// a descriptor.
const Compile = Symbol('PartialClass.compile')

// Bind allows the PartialClass to apply custom policy to the compiled 
// descriptors. Bind is called with the type, name, and descriptor and 
// returns a descriptor. If Bind returns null, then the member is not 
// defined on the type prototype. Concept will return null if the member 
// is already defined on the type prototype.
const Bind = Symbol('PartialClass.bind')

// PreCondition allows the PartialClass to enforce a pre-condition before any
// members are applied. This is not guaranteed to be called if a non-debug 
// version of the code is used. PreCondition is called with the type 
// and returns void.
const PreCondition = Symbol('PartialClass.preCondition')

// PostCondition allows the PartialClass to enforce a post-condition after the
// partial type as been applied. This is not guaranteed to be called if
// a non-debug version of the code is used. PostCondition is called with
// the type and returns void.
const PostCondition = Symbol('PartialClass.postCondition')

// OwnDeclarationSymbols describes how types are associated with the
// PartialClass. PartialClass defines its own sense of hierarchy this way.
const OwnDeclarationSymbols = Symbol('PartialClass.ownDeclaraitionSymbols')

// Declarations is a set on a client type to track which partial types
// have been applied to it via PartialClass.define or indirectly via
// calls to either extend() or implement(). 
const Declarations = Symbol('PartialClass.declarations')

export class PartialClass {
  static Symbol = {
    preCondition: PreCondition,
    ownDeclaraitionSymbols: OwnDeclarationSymbols,
    compile: Compile,
    bind: Bind,
    postCondition: PostCondition,
  }

  constructor() {
    throw new TypeError('PartialClass cannot be instantiated.')
  }

  static [OwnDeclarationSymbols] = { }
  static [Compile](descriptor) { return Compiler.compile(descriptor) }
  static [Bind](type, name, descriptor) { return descriptor }
  static [PreCondition](type, host) { }
  static [PostCondition](type) { }

  static defineOn(type) {
    assert(PartialClassReflect.isPartialClass(this), 
      `PartialClass ${this.name} must indirectly extend PartialClass.`)

    assert(!PartialClassReflect.isPartialClass(type),
      `Expected type '${type.name}' not to be a PartialClass.`)

    this[PreCondition](type)

    for (const declaration of PartialClassReflect.declarations(this))
      declaration.defineOn(type)

    // fetch, compile, bind, and define properties on the type prototype
    const targetPrototype = type.prototype
    const sourcePrototype = this.prototype
    for (const key of ownMemberNamesAndSymbols(sourcePrototype)) {
      const definition = Object.getOwnPropertyDescriptor(sourcePrototype, key)
      const descriptor = this[Compile](definition)
      const boundDescriptor = this[Bind](type, key, descriptor)
      if (!boundDescriptor) continue
      Object.defineProperty(targetPrototype, key, boundDescriptor)
    }

    // add non-annonymous partial type has been applied to the type
    if (this.name) addAssociatedType(type, Declarations, this)

    this[PostCondition](type)
  }
}

export class PartialClassReflect {
  static isPartialClass(type) {
    return !!PartialClassReflect.getPartialClass(type)
  }
  static getPartialClass(type) {
    const partialClass = Object.getPrototypeOf(type)

    // Extension or Concept must extend PartialClass indirectly 
    // by exactly one level
    if (Object.getPrototypeOf(partialClass) != PartialClass)
      return null

    return partialClass
  }

  static *declarations(type, { filterType } = { }) {
    if (PartialClassReflect.isPartialClass(type)) {
      yield* associatedTypes(type, 
        type[OwnDeclarationSymbols], 
        { filterType, traverse: true })
    }
    else {
      yield* associatedTypes(type, 
        { [Declarations]: { filterType } }, 
        { inherit: true })
    }
  }
  static *ownDeclarations(type, { filterType } = { }) {
    if (PartialClassReflect.isPartialClass(type)) {
      yield* associatedTypes(type, 
        type[OwnDeclarationSymbols],
        { filterType })
    }
    else {
      yield* associatedTypes(type, 
        { [Declarations]: { filterType } }, 
        { inherit: false })
    }
  }

  static *memberKeys(type) { 
    assert(PartialClassReflect.isPartialClass(type),
      `Argument type must be a PartialClass.`)

    const filterType = PartialClassReflect.getPartialClass(type)

    yield* associatedKeys(type, 
      type => PartialClassReflect.declarations(type, { filterType }),
      type => PartialClassReflect.ownMemberKeys(type)
    )
  }
  static *ownMemberKeys(type) { 
    assert(PartialClassReflect.isPartialClass(type),
      `Argument type must be a PartialClass.`)

    yield* ownMemberNamesAndSymbols(type.prototype) 
  }
}

