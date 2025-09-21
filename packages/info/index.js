import { assert } from '@kingjs/assert'
import { isPojo } from "@kingjs/pojo-test"
import { Descriptor } from "@kingjs/descriptor"
import { abstract } from "@kingjs/abstract"
import { Normalize } from "@kingjs/normalize"
import { Reflection } from '@kingjs/reflection'
import { PartialClass } from '@kingjs/partial-class'
import { Extension, Extensions } from '@kingjs/extension'
import { Concept } from "@kingjs/concept"
import { Compiler } from "@kingjs/compiler"
import {
  Compile, Bind, PreCondition, PostCondition,
} from "@kingjs/partial-class"
async function __import() {
  const { infoToPojo } = await import('@kingjs/info-to-pojo')
  return { toPojo: infoToPojo }
}

const DeclaredConceptMap = Symbol('DeclaredConceptMap')

const {  
  get: getDescriptor,
  hasValue,
  hasAccessor,
  hasGetter,
  hasSetter,
  hasClassPrototypeDefaults,
} = Descriptor

const ObjectRuntimeNameOrSymbol = new Set([
  '__proto__',
])
const ExtensionRuntimeNameOrSymbol = new Set([
  'constructor',
  Compile, Bind, PreCondition, PostCondition,
])

// Notes to AI:
// - JS convention for predicates is no "has" or "is" prefix, but
// for reflection packages (which typically expose abstractions with
// "info" suffix) we will use "is" prefix.

export class Info {
  static from(fnOrPojo) {
    assert(fnOrPojo instanceof Function || isPojo(fnOrPojo),
      'fnOrPojo must be a function or pojo')
    const fn = isPojo(fnOrPojo) 
      ? Extension.fromPojo(fnOrPojo) : fnOrPojo

    if (fn == PartialClass)
      return new ExtensionInfo(fn)

    if (fn == Concept || Reflection.isExtensionOf(fn, Concept))
      return new ConceptInfo(fn)

    if (fn == Extension || Reflection.isExtensionOf(fn, Extension))
      return new PartialClassInfo(fn)
    
    return new ClassInfo(fn)
  }

  // get name() { abstract() }
  get isNonPublic() { 
    if (typeof this.name === 'symbol') return false

    const name = this.name
    if (name.startsWith('_')) return true
    if (name.endsWith('_')) return true
    if (name.startsWith('$')) return true
    if (name.endsWith('$')) return true
    return false
  }
}

export class FunctionInfo extends Info {
  async __toPojo() {
    const { toPojo } = await __import()
    const pojo = await toPojo(this)
    return pojo
  }
  *__allMembers() {
    yield* FunctionInfo.members(this)
    yield* FunctionInfo.members(this, { isStatic: true })
  }

  static getMember(type, nameOrSymbol, { isStatic = false } = { }) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')

    // base case
    const member = type.getOwnMember(nameOrSymbol, { isStatic })
    if (member) return member

    // recursive case
    if (!type.base) return null
    return FunctionInfo.getMember(type.base, nameOrSymbol, { isStatic })
  }

  static *members(type, { isStatic = false } = { }) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    const keys = [...FunctionInfo.keys(type, { isStatic })]
    yield* keys.map(key => FunctionInfo.getMember(type, key, { isStatic }))
  } 

  static *hierarchy(type, { isStatic = false } = { }) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')

    for (let current = type; current; current = current.base) {
      
      // Typically a given a function F, 
      //    Object.getPrototypeOf(F) 
      // is the function that F extends. But for Function, 
      //    Object.getPrototypeOf(Function)
      // is not Object but the known object Function.prototype. For this
      // reason, Function does not inherit Object static members and
      // so Object should not be included in the *static* hierarchy of 
      // Function.
      if (isStatic && current.isObject$ && !type.isObject$) 
        break

      yield current
    }
  }

  static *concepts(type) {
    yield* this.concepts$(type, {
      includeInherited: true,
    })
  }

  static conceptMap(type) {
    // map of member names to set of concepts with that name
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    if (type[DeclaredConceptMap])
      return type[DeclaredConceptMap]

    const map = new Map()
    for (const concept of this.concepts(type)) {
      for (const name of this.keys(concept)) {
        let set = map.get(name)
        if (!set) {
          set = new Set()
          map.set(name, set)
        }
        set.add(concept)
      }
    }

    type[DeclaredConceptMap] = map
    return map
  }

  static *names(type, { isStatic = false } = { }) {
    yield* FunctionInfo.namesOrSymbols$(type, { 
      isStatic, 
      includeExtensions: true, 
      includeInherited: true, 
      includeNames: true 
    })
  }

  static *symbols(type, { isStatic = false } = { }) {
    yield* FunctionInfo.namesOrSymbols$(type, { 
      isStatic,
      includeExtensions: true,
      includeInherited: true, 
      includeSymbols: true 
    })
  }

  static *keys(type, { isStatic = false } = { }) {
    yield* FunctionInfo.names(type, { isStatic })
    yield* FunctionInfo.symbols(type, { isStatic })
  }

  static *concepts$(type, {
    includeInherited,
    visited
  } = { }) {
    if (!visited) visited = new Set()

    for (const current of FunctionInfo.hierarchy(type)) {
      for (const concept of current.ownConcepts$()) {
        if (visited.has(concept.#fn)) continue
        visited.add(concept.#fn)
        yield concept
      }

      if (!includeInherited) break

      // Partial types "inherit" via the Extensions mechanism whereas
      // non-partial types inherit via the prototype chain. The same
      // code path can be used by both (without checking .isPartial) 
      // because, by construction, partial types inherit no members via 
      // their prototype chain, and non-partial types have no extensions.
      for (const extension of current.extensions()) {
        yield* FunctionInfo.concepts$(extension, {
          includeInherited,
          visited
        })
      }
    }
  }

  static *namesOrSymbols$(type, { 
    isStatic, 
    includeNames, 
    includeSymbols,
    includeExtensions,
    includeInherited, 
    visited
  } = { }) {
    assert(type instanceof FunctionInfo, 'type must be a FunctionInfo')
    if (!visited) visited = new Set()

    // avoid for..of (due to V8 bug)
    //for (const current of FunctionInfo.hierarchy(type, { isStatic })) {

    const hierarchy = [...FunctionInfo.hierarchy(type, { isStatic })]
    for (let i = 0; i < hierarchy.length; i++) {
      const current = hierarchy[i]

      function *yieldNameOrSymbols(fnName) {
        for (const key of current[fnName]({ isStatic })) {
          if (visited.has(key)) continue
          visited.add(key)
          yield key
        }
      }

      if (includeNames) yield* yieldNameOrSymbols('ownNames$')
      if (includeSymbols) yield* yieldNameOrSymbols('ownSymbols$')

      if (!isStatic && includeExtensions) {
        for (const extension of current.extensions()) {
          yield* FunctionInfo.namesOrSymbols$(extension, { 
            isStatic, 
            includeNames, 
            includeSymbols, 
            includeExtensions,
            // Partial classes are restricted such that they only have members 
            // on the most extended type so there is no need to traverse the 
            // hierarchy of extensions.
            // includeInherited: true,
            visted: visited
          })
        }
      }

      if (!includeInherited) break
    }
  }

  #fn

  constructor(fn) {
    super()
    this.#fn = fn
  }

  get isObject$() { return this.#fn === Object }

  get root$() { return FunctionInfo.Object }
  isRuntimeNameOrSymbol$(nameOrSymbol) {
    return ObjectRuntimeNameOrSymbol.has(nameOrSymbol)
  }
  compile$(descriptor) { 
    return descriptor 
  }
  getDefinitions$({ isStatic = false } = { }) {
    return isStatic ? this.#fn : this.#fn.prototype
  }
  get includeExtensions$() { return true }

  *ownConcepts$() {
    for (const concept of Concept.getOwnDeclarations(this.#fn))
      yield Info.from(concept)
  }
  *ownNames$({ isStatic = false } = { }) {
    const definitions = this.getDefinitions$({ isStatic })
    if (definitions) {
      for(const name of Object.getOwnPropertyNames(definitions)) {
        if (this.isRuntimeNameOrSymbol$(name)) continue
        yield name
      }
    }
  }
  *ownSymbols$({ isStatic = false } = { }) {
    const definitions = this.getDefinitions$({ isStatic })
    if (definitions) {
      for(const symbol of Object.getOwnPropertySymbols(definitions)) {
        // if (this.isRuntimeNameOrSymbol$(symbol)) continue
        yield symbol
      }
    }
  }

  get isExtension() { return Reflection.isExtensionOf(this.#fn, PartialClass) }
  get isPartial() { return Reflection.isExtensionOf(this.#fn, Extension) }
  get isConcept() { return Reflection.isExtensionOf(this.#fn, Concept) }

  get ctor() { return this.#fn }
  get name() { return this.#fn.name ? this.#fn.name : null }
  get root() { return this.root$ }
  get base() { 
    if (this.equals(this.root)) return null

    const baseFn = Object.getPrototypeOf(this.ctor)
    
    // special case 'boostrap circle' for Function
    if (baseFn == Function.prototype) return FunctionInfo.Object

    return Info.from(baseFn) 
  }

  *extensions({ reverse = false } = { }) { 
    if (!this.isPartial) return
    const extensions = Normalize.ToArray(this.#fn[Extensions])
      .map(fn => Info.from(fn))
    if (reverse) extensions.reverse()
    yield* extensions
  }

  *getOwnConcepts() {
    yield* FunctionInfo.concepts$(this)
  }

  *ownNames({ isStatic = false } = { }) { 
    const options = { isStatic, includeNames: true }
    options.includeExtensions = this.includeExtensions$
    yield* FunctionInfo.namesOrSymbols$(this, options)
  }

  *ownSymbols({ isStatic = false } = { }) { 
    const options = { isStatic, includeSymbols: true }
    options.includeExtensions = this.includeExtensions$
    yield* FunctionInfo.namesOrSymbols$(this, options)
  }

  *ownKeys({ isStatic = false } = { }) {
    yield* this.ownNames({ isStatic })
    yield* this.ownSymbols({ isStatic })
  }

  *ownMembers({ isStatic = false } = { }) {
    for (const nameOrSymbol of this.ownKeys({ isStatic })) {
      const member = this.getOwnMember(nameOrSymbol, { isStatic })
      if (member) yield member
    }
  }

  getOwnDescriptor(nameOrSymbol, { isStatic = false } = { }) {
    if (this.isRuntimeNameOrSymbol$(nameOrSymbol)) return null
    const definitions = this.getDefinitions$({ isStatic })
    if (!definitions) return null
    const descriptor = Object.getOwnPropertyDescriptor(definitions, nameOrSymbol)
    if (!descriptor) return null
    return DescriptorInfo.create$(this.compile$(descriptor))
  }

  getOwnMember(nameOrSymbol, { isStatic = false } = { }) {
    if (!isStatic) {
      // PartialClass members load after own members so will override them.
      // To emulate this behavior, getOwnMember needs to traverse
      // the tree of extensions in reverse order.
      for (const extension of this.extensions({ reverse: true })) {
        const member = FunctionInfo.getMember(extension, nameOrSymbol)
        if (member) return member
      }
    }

    const descriptorInfo = this.getOwnDescriptor(nameOrSymbol, { isStatic })
    if (!descriptorInfo) return null

    return MemberInfo.create$(
      this, nameOrSymbol, descriptorInfo, { isStatic })
  }

  equals(other) {
    if (!(other instanceof FunctionInfo)) return false
    return this.#fn === other.#fn
  }

  toString() { return [
      this.name ?? '<anonymous>',
      this.isConcept ? 'Concept' :
        this.isPartial ? 'Extension' : null,
    ].filter(Boolean).join(', ') 
  }
}
export class ClassInfo extends FunctionInfo { 
  static {
    Info.Object = new ClassInfo(Object)
    Info.Function = new ClassInfo(Function)
    Info.Array = new ClassInfo(Array)
    Info.String = new ClassInfo(String)
    Info.Number = new ClassInfo(Number)
    Info.Boolean = new ClassInfo(Boolean)
  }
}
export class ExtensionInfo extends FunctionInfo { 
  static {
    Info.PartialClass = new ExtensionInfo(PartialClass)
  }
  get root$() { return Info.PartialClass }
  get includeExtensions$() { return false }
  isRuntimeNameOrSymbol$(nameOrSymbol) {
    return ExtensionRuntimeNameOrSymbol.has(nameOrSymbol)
  }
  getDefinitions$({ isStatic = false } = { }) {
    return isStatic ? null : super.getDefinitions$()
  }
}
export class PartialClassInfo extends ExtensionInfo {
  static {
    Info.Extension = new PartialClassInfo(Extension)
  }

  constructor(fn) {
    assert(fn == Extension
      || Object.getPrototypeOf(fn) == Extension,
      `Partial class ${fn.name} must directly extend Extension.`
    )
    super(fn)
  }

  compile$(descriptor) { 
    return Compiler.compile(descriptor) 
  }
}
export class ConceptInfo extends ExtensionInfo {
  static {
    Info.Concept = new ConceptInfo(Concept)
  }
  constructor(fn) {
    assert(fn == Concept
      || Object.getPrototypeOf(fn) == Concept,
      `Concept ${fn.name} must directly extend Concept.`
    )
    super(fn)
  }

  compile$(descriptor) { 
    return Concept[Compile](descriptor) 
  }
  *ownConcepts$() {
    for (const extension of this.extensions()) {
      if (extension.isConcept)
        yield extension
    }
  }
}

export class MemberInfo extends Info {
  static create$(host, nameOrSymbol, descriptor, metadata) {
    assert(host instanceof FunctionInfo, 
      'type must be a FunctionInfo')
    assert(descriptor instanceof DescriptorInfo, 
      'descriptor must be a DescriptorInfo')
    assert(descriptor.isData || descriptor.isMethod || descriptor.isAccessor,
      'descriptor must be a data, method, or accessor descriptor')
    
    const ctor = 
      descriptor.isMethod ? MethodMemberInfo 
      : descriptor.isData ? DataMemberInfo 
      : AccessorMemberInfo
    
    return new ctor(host, nameOrSymbol, descriptor, metadata)
  }

  #host
  #name
  #descriptor
  #isStatic

  constructor(host, name, descriptor, metadata = { 
    isStatic: false,
  }) {
    super()
    this.#host = host
    this.#name = name
    this.#descriptor = descriptor

    const { isStatic } = metadata
    this.#isStatic = isStatic
  }

  get #concepts() { 
    return FunctionInfo.conceptMap(this.host)?.get(this.name) 
      ?? new Set()
  }

  baseOrSelf$() { 
    const parent = this.parent()
    if (!parent) return this
    return parent.baseOrSelf$() 
  }

  get host() { return this.#host }
  get name() { return this.#name }
  get isKnown() {
    if (this.host.equals(FunctionInfo.Object)) return true
    if (this.host.equals(FunctionInfo.Function)) return true
    if (this.isConstructor) return true

    // All Function extensions implement as own members the following
    // known static data members.
    if (this.isStatic) {
      if (this.isData) {
        if (this.name == 'length') return true
        if (this.name == 'name') return true
        if (this.name == 'prototype') return true
      }
    }
  }

  get isAccessor() { return this instanceof AccessorMemberInfo }
  get isMethod() { return this instanceof MethodMemberInfo }
  get isData() { return this instanceof DataMemberInfo }
  get isConstructor() {
    if (this.name !== 'constructor') return false
    if (this.isStatic) return false
    if (!this.isData) return false
    return true
  }
  get type() {
    if (this.isAccessor) return 'accessor'
    if (this.isData) return 'data'
    if (this.isMethod) return 'method'
  }

  get isConceptual() { return this.#concepts.size > 0 }
  *concepts() { 
    const concepts = this.#concepts
    yield* concepts
  }

  get isStatic() { return this.#isStatic }

  get isEnumerable() { return this.#descriptor.isEnumerable }
  get isConfigurable() { return this.#descriptor.isConfigurable }
  get isWritable() { return this.#descriptor.isWritable }

  get hasGetter() { return this.#descriptor.hasGetter }
  get hasSetter() { return this.#descriptor.hasSetter }
  get hasValue() { return this.#descriptor.hasValue }

  get getter() { return this.#descriptor.getter }
  get setter() { return this.#descriptor.setter }
  get value() { return this.#descriptor.value }

  get isAbstract() { 
    if (this.isMethod && this.value === abstract) 
      return true
    if (this.isAccessor && 
      (this.getter === abstract || this.setter === abstract))
      return true
    return false
  }

  parent() {
    // get member from the parent type
    const parent = this.host.base
    if (!parent) return null
    const isStatic = this.isStatic
    return parent.getOwnMember(this.name, { isStatic })
  }
  root() {
    let parent = this.parent()
    if (!parent) return null
    return parent.baseOrSelf$()
  }
  rootHost() {
    return this.root()?.host ?? null
  }

  equals(other) {
    if (!(other instanceof MemberInfo)) return false
    if (this.#isStatic !== other.#isStatic) return false
    if (!this.#host.equals(other.#host)) return false
    if (this.#name !== other.#name) return false
    return true
  }

  toString() { 
    const nameIsSymbol = typeof this.name === 'symbol'
    const value = 
      this.isAbstract ? 'abstract' 
      : this.isMethod || this.isAccessor ? 'method'
      : this.value instanceof Array ? 'array'
      : this.value === null ? 'null'
      : this.value === undefined ? 'undefined'
      : typeof this.value

    const name = nameIsSymbol ? `[${this.name.toString()}]` : this.name
    return [
      [
        this.isStatic ? 'static' : null,
        this.hasValue && !this.isWritable ? 'const' : null,
        this.isData && !this.isEnumerable ? 'hidden' : null,
        !this.isConfigurable ? 'sealed' : null,
        name, '{', [
          !this.hasGetter ? null : `get: ${value}`,
          !this.hasSetter ? null : `set: ${value}`,
          !this.hasValue ? null : `value: ${value}`,
        ].filter(Boolean).join('; '), '}'
      ].filter(Boolean).join(' '),
      this.host.name
    ].filter(Boolean).join(', ')
  }
}
export class ValueMemberInfo extends MemberInfo { }
export class MethodMemberInfo extends ValueMemberInfo { }
export class DataMemberInfo extends ValueMemberInfo { }
export class AccessorMemberInfo extends MemberInfo { }

export class DescriptorInfo {
  static create$(descriptor) {
    if (hasValue(descriptor)) {
      const value = descriptor.value
      if (typeof value !== 'function') 
        return new DataDescriptorInfo(descriptor)

      // data member returning a function declared as a class
      if (hasClassPrototypeDefaults(getDescriptor(value, 'prototype')))
        return new DataDescriptorInfo(descriptor) 

      // todo: treat visible function as data? 

      // data member returning a value declared as a method
      return new MethodDescriptorInfo(descriptor)
    }
    assert(hasAccessor(descriptor))
    return new AccessorDescriptorInfo(descriptor)
  }

  #descriptor

  constructor(descriptor) {
    this.#descriptor = descriptor
  }

  // type of descriptor
  get isAccessor() { return this instanceof AccessorDescriptorInfo }
  get isMethod() { return this instanceof MethodDescriptorInfo }
  get isData() { return this instanceof DataDescriptorInfo }
  
  get hasGetter() { return hasGetter(this.descriptor) }
  get hasSetter() { return hasSetter(this.descriptor) }
  get hasValue() { return this instanceof ValueDescriptorInfo }

  get getter() { return this.descriptor.get }
  get setter() { return this.descriptor.set }
  get value() { return this.descriptor.value }
  
  get descriptor() { return this.#descriptor }
  get isEnumerable() { return this.descriptor.enumerable }
  get isConfigurable() { return this.descriptor.configurable }
  get isWritable() { return this.descriptor.writable }
}
export class AccessorDescriptorInfo extends DescriptorInfo { }
export class ValueDescriptorInfo extends DescriptorInfo { }
export class DataDescriptorInfo extends ValueDescriptorInfo { }
export class MethodDescriptorInfo extends ValueDescriptorInfo { }

