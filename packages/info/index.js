import { assert } from '@kingjs/assert'
import { isPojo } from "@kingjs/pojo-test"
import { abstract } from "@kingjs/abstract"
import { Normalize } from "@kingjs/normalize"
import { Reflection } from '@kingjs/reflection'
import { 
  PartialClass, 
  PartialClassReflect, 
  AnonymousPartialClass,
  Compile,
} from '@kingjs/partial-class'
import { 
  Extension, 
  Extensions, 
} from '@kingjs/extension'
import { Concept, ConceptReflect } from "@kingjs/concept"
import { Compiler } from "@kingjs/compiler"
import { Es6Info, Es6ClassInfo } from "@kingjs/es6-info"

// import { Es6DescriptorInfo } from './es6-descriptor-info.js'

const DeclaredConceptMap = Symbol('DeclaredConceptMap')

// const ObjectRuntimeNameOrSymbol = new Set([
//   '__proto__',
// ])
const ExtensionRuntimeNameOrSymbol = new Set([
  'constructor',
])

// Notes to AI:
// - JS convention for predicates is no "has" or "is" prefix, but
// for reflection packages (which typically expose abstractions with
// "info" suffix) we will use "is" prefix.

export class Info {
  static from(type) {
    if (isPojo(type))
      type = AnonymousPartialClass.create(es6ClassInfo)
      
    const es6ClassInfo = PartialClassReflect.getClassInfo(type)
    const fn = es6ClassInfo.ctor

    if (fn == PartialClass)
      return new PartialClassInfo(es6ClassInfo)

    if (fn == Concept || Reflection.isExtensionOf(fn, Concept))
      return new ConceptInfo(es6ClassInfo)

    if (fn == Extension || Reflection.isExtensionOf(fn, Extension))
      return new ExtensionInfo(es6ClassInfo)
    
    return new ClassInfo(es6ClassInfo)
  }
}

export class FunctionInfo extends Info {

  static getMember(type, key, { isStatic = false } = { }) {
    const es6MemberInfo = Es6ClassInfo.getMember(type, key, { isStatic })
    if (!es6MemberInfo) return null
    return MemberInfo.from$(es6MemberInfo)  
  }

  static *members(type, { isStatic = false } = { }) {
    
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
        if (visited.has(concept.ctor)) continue
        visited.add(concept.ctor)
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

  #_
  #es6FnInfo

  constructor(es6FnInfo) {
    super()
    this.#es6FnInfo = es6FnInfo
    this.#_ = this.toString()
  }

  get isObject$() { return this.#es6FnInfo.isObject$ }

  get root$() { return FunctionInfo.Object }
  isRuntimeNameOrSymbol$(nameOrSymbol) {
    return ObjectRuntimeNameOrSymbol.has(nameOrSymbol)
  }
  compile$(descriptor) { 
    return descriptor 
  }
  getDefinitions$({ isStatic = false } = { }) {
    return isStatic ? this.#es6FnInfo : this.#es6FnInfo.prototype
  }
  get includeExtensions$() { return true }

  *ownConcepts$() {
    for (const concept of ConceptReflect.ownConcepts(this.#es6FnInfo))
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

  get isExtension() { return this instanceof PartialClassInfo }
  get isPartial() { return this instanceof ExtensionInfo }
  get isConcept() { return this instanceof ConceptInfo }

  get ctor() { return this.#es6FnInfo.ctor }
  get name() { return this.#es6FnInfo.name }
  get base() { return Es6Info.from(this.#es6FnInfo.base) }
  get root() { return this.root$ }

  *extensions({ reverse = false } = { }) { 
    if (!this.isPartial) return
    const extensions = Normalize.ToArray(this.#es6FnInfo[Extensions])
      .map(fn => Info.from(fn))
    if (reverse) extensions.reverse()
    yield* extensions
  }

  *ownConcepts() {
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
    return Es6DescriptorInfo.create(this.compile$(descriptor))
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

    return MemberInfo.from$(
      this, nameOrSymbol, descriptorInfo, { isStatic })
  }

  equals(other) {
    if (!(other instanceof FunctionInfo)) return false
    return this.#es6FnInfo === other.#es6FnInfo
  }

  toString() { return [
      this.name ?? '<anonymous>',
      this.isConcept ? 'Concept' :
        this.isPartial ? 'Partial' : null,
    ].filter(Boolean).join(', ') 
  }
}
export class ClassInfo extends FunctionInfo { 
  static {
    Info.Object = Info.from(Object)
    Info.Function = Info.from(Function)
    Info.Array = Info.from(Array)
    Info.String = Info.from(String)
    Info.Number = Info.from(Number)
    Info.Boolean = Info.from(Boolean)
  }
}
export class PartialClassInfo extends FunctionInfo { 
  static {
    Info.PartialClass = new PartialClassInfo(PartialClass)
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
export class ExtensionInfo extends PartialClassInfo {
  static {
    Info.Extension = new ExtensionInfo(Extension)
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
export class ConceptInfo extends PartialClassInfo {
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
  static from$(es6MemberInfo, host = null) {
    assert(es6MemberInfo instanceof Es6DescriptorInfo, 
      'descriptor must be a Es6MemberInfo')
      
    assert(host instanceof ClassInfo, 
      'type must be a ClassInfo')
    
    return new MemberInfo(es6MemberInfo, host)
  }

  #host
  #es6MemberInfo

  constructor(es6MemberInfo, host) {
    super()
    this.#host = host
    this.#es6MemberInfo = es6MemberInfo
  }

  get host() { return this.#host }
  get name() { return this.#es6MemberInfo.name }
  get isKnown() { this.#es6MemberInfo.isKnown }

  get isAccessor() { return this.#es6MemberInfo.isAccessor }
  get isMethod() { return this.#es6MemberInfo.isMethod }
  get isData() { return this.#es6MemberInfo.isData }
  get isConstructor() { return this.#es6MemberInfo.isConstructor }
  get type() { return this.#es6MemberInfo.type }

  get isStatic() { return this.#es6MemberInfo.isStatic }

  get isEnumerable() { return this.#es6MemberInfo.isEnumerable }
  get isConfigurable() { return this.#es6MemberInfo.isConfigurable }
  get isWritable() { return this.#es6MemberInfo.isWritable }

  get hasGetter() { return this.#es6MemberInfo.hasGetter }
  get hasSetter() { return this.#es6MemberInfo.hasSetter }
  get hasValue() { return this.#es6MemberInfo.hasValue }

  get getter() { return this.#es6MemberInfo.getter }
  get setter() { return this.#es6MemberInfo.setter }
  get value() { return this.#es6MemberInfo.value }

  get isAbstract() { 
    if (this.isMethod) {
      if (this.value == abstract)
        return true
    }

    if (this.isAccessor) {
      if (this.getter == abstract || this.setter == abstract)
        return true
    }

    return false
  }

  get isConceptual() { 
    return this.concepts().next().done == false
  }
  *concepts() { 
    const hosts = [...ConceptReflect.memberHosts(this.host.ctor, this.name)]
    yield* hosts.map(fn => Info.from(fn))
  }

  // parent() {
  //   return MemberInfo.from$(this.#es6MemberInfo.parent())
  // }
  // root() {
  //   return MemberInfo.from$(this.#es6MemberInfo.root())
  // }
  // rootHost() {
  //   return FunctionInfo.from(this.#es6MemberInfo.rootHost())
  // }

  equals(other) {
    if (!(other instanceof MemberInfo)) return false
    return this.#es6MemberInfo.equals(other.#es6MemberInfo)
  }

  toString() { 
    return this.#es6MemberInfo.toString({
      modifiers: [ this.isAbstract ? 'abstract' : null ]
    })
  }
}
