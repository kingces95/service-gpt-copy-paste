import { URL } from 'url'

async function __import() {
  const { nodeNameToPojo } = await import('@kingjs/node-name-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: nodeNameToPojo, dumpPojo }
}

export const SCHEME = 'nodejs:'
export const HOST = 'nodejs.org'
export const GLOBAL = 'global'
export const LOCAL = 'local'
export const DEFAULT = 'default'

const JSON_IMPORT_OPTIONS = { with: { type: 'json' } }

function assert(value, message) { 
  if (!value) throw new Error(message || 'Assertion failed.') 
}
function isAlphanumeric(value) { return /^[a-zA-Z0-9-_.]+$/.test(value) }
function isCapitalized(value) { return value[0] === value[0].toUpperCase() }
function isNotCapitalized(value) { return value[0] !== value[0].toUpperCase() }
function isTypeName(value) { return value && isAlphanumeric(value) && isCapitalized(value) }
function isScopeName(value) { return value && isAlphanumeric(value) && isNotCapitalized(value) }
function assertAreTypeNames(...values) {
  if (values.some(v => !isTypeName(v))) {
    throw new Error(`Expected TypeName, got "${values.join(', ')}".`)
  }
}
function assertAreScopeNames(...values) {
  if (values.some(v => !isScopeName(v))) {
    throw new Error(`Expected ScopeName, got: ${values.join(', ')}`)
  }
}
function snakeToCamelCase(value) {
  return value.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}
function perlToCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}
function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1)
}

export class NodeName {
  async __dump() { 
    const { toPojo, dumpPojo } = await __import()
    const pojo = await toPojo(this)
    await dumpPojo(pojo) 
  }

  static scopeToTypeCase(value) {
    if (!value)
      return null
    return capitalize(snakeToCamelCase(perlToCamelCase(value)))
  }
  
  static fromScope(scope, name, ...exports) {
    return new ModuleName({ scope, name, exports })
  }

  static fromName(name, ...exports) {
    return ModuleName.fromScope(GLOBAL, name, ...exports)
  }

  static from(value, moduleName) {
    const parts = NodeName.parse(value)
    if (parts.packageName) return new NodeName(parts)

    if (!moduleName)
      throw new Error(`Cannot resolve ${value} without a module name.`)
    const scopedParts = { ...moduleName.#parts, ...parts }
    return new NodeName(scopedParts)
  }

  static parse(value) {
    // e.g. node://nodejs.org/myModule#myNs.MyType
    if (value.includes(SCHEME)) {
      return NodeName.parseUrl(value)
    }

    // e.g @myScope/myModule, MyType
    // e.g @myScope/myModule, myNs.MyType
    // e.g myModule, MyType
    if (value.includes(',')) {
      const [moduleName, typeName] = value.split(/,\s*/) 
      const typeNameParts = NodeName.parseTypeName(typeName)
      const moduleNameParts = NodeName.parseModuleName(moduleName)
      return { ...moduleNameParts, ...typeNameParts }
    }
    
    // e.g myNs.MyType
    if (value.includes('.') || value.includes('+')) { 
      return NodeName.parseTypeName(value) 
    }
    
    // e.g @myScope/myModule
    if (value.includes('/')) { 
      return { ...NodeName.parseModuleName(value) } 
    }
    
    // e.g MyType
    if (value[0] === value[0].toUpperCase()) { 
      return NodeName.parseTypeName(value)
    }
    
    // e.g myModule
    // Could be a namespace, but we choose to treat it as an import
    return { ...NodeName.parseModuleName(value) }
  }

  static parseUrl(value) {
    const [ moduleImport, hash ] = value.split('#')

    // e.g. node://nodejs.org/myScope/myModule/myExport/mySubExport
    // e.g. node://nodejs.org/global/myModule/myExport
    // e.g. node://nodejs.org/global/myModule
    const url = new URL(moduleImport)
    
    if (url.protocol !== SCHEME) {
      throw new Error(`Expected scheme "${SCHEME}", got "${url.protocol}".`)
    }
    
    if (url.host !== HOST) {
      throw new Error(`Expected host "${HOST}", got "${url.host}".`)
    }

    // e.g. myScope
    const scope = url.pathname.split('/')[1]

    // e.g. myModule
    const packageName = url.pathname.split('/')[2]
    
    // e.g. myExport, mySubExport
    const exports = url.pathname.split('/').slice(3) 
    
    assertAreScopeNames(scope, packageName, ...exports)
    const moduleNameParts = { scope, packageName, exports }
    const typeNameParts = hash ? NodeName.parseTypeName(hash) : { }
    
    return { ...moduleNameParts, ...typeNameParts }
  }

  static parseTypeName(value) {
    // e.g. myNs.MyType
    // e.g. myNs.mySubNs.MyType
    // e.g. MyType
    // e.g. MyType+MyNestedType
    // e.g. MyType+MyNestedType+MyNestedNestedType
    // e.g. myNs.mySubNs.MyType+MyNestedType
    const dotSplit = value.split('.')
    const namespaces = dotSplit.slice(0, -1)
    const pluses = dotSplit[dotSplit.length - 1]
    const plusSplit = pluses.split('+')
    const name = plusSplit.pop()
    const nestings = plusSplit

    assertAreScopeNames(...namespaces)
    assertAreTypeNames(...nestings)
    assert(isTypeName(name) || isScopeName(name))
    return { namespaces, nestings, name }
  }
  
  static parseModuleName(value) {
    // e.g. @myScope/myModule
    // e.g. @myScope/myModule/myExport
    // e.g. myModule
    // e.g. myModule/myExport
    // e.g. myModule/myExport/mySubExport

    const parts = value.split('/')
    const isScoped = parts[0].startsWith('@')
    // e.g. myScope
    const scope = isScoped ? parts.shift().slice(1) : GLOBAL
    // e.g. myModule
    const packageName = parts.shift()
    // e.g. myExport, mySubExport
    const exports = parts

    assertAreScopeNames(scope, packageName, ...exports)
    return { scope, packageName, exports }
  }

  #scope
  #packageName
  #exports
  #namespaces
  #nestings
  #name

  constructor(parts) {

    // module parts
    const { scope = GLOBAL, packageName, exports = [] } = parts
    assertAreScopeNames(scope, packageName, ...exports)
    this.#scope = scope // e.g. myScope
    this.#packageName = packageName // e.g. myModule
    this.#exports = exports.length ? exports : undefined // e.g. myExport, mySubExport

    // full name parts
    const { namespaces = [], nestings = [], name } = parts
    assertAreScopeNames(...namespaces)
    assertAreTypeNames(...nestings)
    if (name)
      assert(isTypeName(name) || isScopeName(name))
    this.#namespaces = namespaces.length ? namespaces : undefined
    this.#nestings = nestings.length ? nestings : undefined
    this.#name = name

    if (this.#nestings && !isTypeName(name))
      throw new Error(`Expected TypeName, got "${name}".`)
  }

  get #isGlobal() { return this.#scope === GLOBAL }
  get #isScoped() { return !!this.#scope && !this.#isGlobal }

  get #parts() {
    return { 
      scope: this.#scope, 
      packageName: this.#packageName, 
      exports: this.#exports,
      namespaces: this.#namespaces, 
      nestings: this.#nestings, 
      name: this.#name 
    }
  }

  get #fullName() {
    return [
      this.#namespaces?.join('.') || null,
      [
        this.#nestings?.join('+') || null, 
        this.#name
      ].filter(Boolean).join('+')
    ].filter(Boolean).join('.') || null
  }

  get type() {
    if (this.isModuleName) return 'export'
    if (this.isNamespace) return 'namespace'
    if (this.isTypeName) return 'type'
    throw new Error('Unknown type.')
  }
  get isModuleName() { return !this.#name }
  get isNamespace() { return isScopeName(this.#name) }
  get isTypeName() { return isTypeName(this.#name) }

  get name() { 
    return this.#name ? this.#name
      : this.#exports ? this.#exports[this.#exports.length - 1]
      : this.#packageName
  }
  get parentUrl() { return this.parent?.url }
  get parent() {
    if (this.#nestings) {
      const nestings = [...this.#nestings]
      const name = nestings.pop()
      return new NodeName({
        ...this.moduleName.#parts,
        namespaces: this.#namespaces,
        nestings: nestings.length ? nestings : undefined,
        name,
      })
    }

    if (this.#namespaces) {
      const namespaces = [...this.#namespaces]
      const name = namespaces.pop()
      return new NodeName({
        ...this.moduleName.#parts,
        namespaces: namespaces.length ? namespaces : undefined,
        name,
      })
    }

    if (this.#name) {
      return new NodeName({
        ...this.moduleName.#parts
      })
    }

    if (this.#exports) {
      const exports = [...this.#exports]
      exports.pop()
      return new NodeName({
        ...this.moduleName.#parts,
        exports: exports.length ? exports : undefined,
      })
    }

    return null
  }

  get packageName() { 
    if (this.isModuleName && !this.#exports)
      return this

    return new NodeName({ 
      scope: this.#scope, 
      packageName: this.#packageName,
    })
  }

  get moduleName() { 
    if (this.isModuleName)
      return this

    return new NodeName({ 
      scope: this.#scope, 
      packageName: this.#packageName, 
      exports: this.#exports,
    })
  }

  get typeName() {
    if (this.isTypeName)
      return this

    return new NodeName({ 
      ...this.#parts,
      name: NodeName.scopeToTypeCase(this.name)
    })
  }

  addExport(...exports) {
    return new ModuleName({ 
      scope: this.#scope, 
      packageName: this.#packageName,
      exports: [...(this.#exports || []), ...exports] 
    })
  }

  addType(...names) {
    return new TypeName({ 
      ...this.moduleName.#parts, 
      name: names.pop(), 
      namespaces: [...names],
    })
  }

  addNamespace(...names) {
    const namespaces = [...this.#namespaces, ...[this.#name], ...names]
    const name = namespaces.pop()
    return new TypeName({ 
      ...this.moduleName.#parts, 
      namespaces: namespaces.length ? namespaces : undefined,
      name
    })
  }

  addName(...names) {
    const nestings = [...this.#nestings, ...[this.#name], ...names]
    const name = namespaces.pop()
    return new TypeName({ 
      ...this.moduleName.#parts, 
      namespaces: this.#namespaces,
      nestings: nestings.length ? nestings : undefined,
      name,
    })
  }

  get url() {
    // e.g. node://nodejs.org/myScope/myModule/myExport/mySubExport
    // e.g. node://nodejs.org/global/myModule/myExport
    // e.g. node://nodejs.org/global/myModule
    // e.g. node://nodejs.org/global/myModule#myNs.MyType
    // e.g. node://nodejs.org/global/myModule#myNs.MyType+MyNestedType
    // e.g. node://nodejs.org/global/myModule#myNs.MyType+MyNestedType+MyNested
    return new URL([
      [
        `${SCHEME}//${HOST}`, 
        this.#scope, 
        this.#packageName, 
        ...(this.#exports || [])
      ].filter(Boolean).join('/'), 
      this.#fullName
    ].filter(Boolean).join('#'))  
  }

  async import() { 
    if (!this.isModuleName)
      throw new Error('Cannot import a non-export name.')
    return import(this.toString()) 
  }

  async importJson() { 
    if (!this.isModuleName)
      throw new Error('Cannot import a non-export name.')
    const module = await import(this.toString(), JSON_IMPORT_OPTIONS)
    return module?.default 
  }

  async getType() {
    if (this.isModuleName) {
      const import$ = await this.import()
      return import$?.default ?? this.typeName.getType()
    }

    if (this.isNamespace)
      throw new Error('Cannot load a namespace as a type.')

    const parent = this.parent
    const scope = parent.isTypeName ? 
      await parent.getType() :
      await parent.getNamespace()

    return await scope[this.#name]
  }

  async getNamespace() {
    if (this.isModuleName)
      return await this.import()

    if (this.isTypeName)
      throw new Error('Cannot load a type as a namespace.')

    const scope = this.parent.loadNamespace()
    return await scope[this.#name]
  }

  toString() {
    // e.g. myExport/mySubExport
    const exportPath = [
      this.#packageName, 
      ...(this.#exports || [])
    ].filter(Boolean).join('/')


    // e.g. @myScope/myModule/myExport/mySubExport
    const moduleName = this.#isScoped 
      ? `@${this.#scope}/${exportPath}` 
      : exportPath

    return [
      moduleName, 
      this.#fullName
    ].filter(Boolean).join(', ')
  }
}

// async function test() {
//   const ids = [
//     'nodejs://nodejs.org/myScope/myModule/myExport',
//     'nodejs://nodejs.org/myScope/myModule/myExport#myNs.mySubNs.MyType+MyNestedType+MyNestedNestedType',
//     'nodejs://nodejs.org/myScope/myModule#myNs.mySubNs.MyType+MyNestedType',
//     'nodejs://nodejs.org/myScope/myModule#myNs.mySubNs.MyType',
//     'nodejs://nodejs.org/myScope/myModule#myNs.MyType',
//     'nodejs://nodejs.org/myScope/myModule#MyType',
//     'nodejs://nodejs.org/myScope/myModule',
//     'nodejs://nodejs.org/global/myModule',
//     'nodejs://nodejs.org/global/my-module',
//     'nodejs://nodejs.org/global/my_module',
//     '@myScope/myModule, myNs.MyType',
//     '@myScope/myModule, MyType',
//     '@myScope/myModule',
//     'myModule, myNs.MyType',
//     'myModule, myNs.mySubNs',
//     'myModule, myNs',
//     'myModule, MyType',
//     'myModule',
//   ]
//   for (var id of ids) {
//     console.error(`-- ${id}`)
//     const typeName = await NodeName.from(id)
//     await typeName.__dump()
//   }
// }

// test()
