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
    return new NodeName({ ...moduleName.moduleParts, ...parts })
  }

  static parse(value) {
    // e.g. node://nodejs.org/myModule#myNs.MyType
    if (value.includes(SCHEME)) {
      return NodeName.parseUrl(value)
    }

    // e.g. myModule
    // e.g. myNs.MyType
    return NodeName.parseQualifiedTypeName(value)
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
    const moduleParts = { scope, packageName, exports }
    const fullNameParts = hash ? NodeName.parseFullName(hash) : { }
    
    return { ...moduleParts, ...fullNameParts }
  }

  static parseFullName(value) {
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
  
  static parseImport(value) {
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

  static parseQualifiedTypeName(value) {
    if (!value)
      return { }
    
    // e.g @myScope/myModule, MyType
    // e.g @myScope/myModule, myNs.MyType
    // e.g myModule, MyType
    if (value.includes(',')) {
      const [moduleImport, fullName] = value.split(/,\s*/) 
      const fullNameParts = NodeName.parseFullName(fullName)
      const moduleParts = NodeName.parseImport(moduleImport)
      return { ...moduleParts, ...fullNameParts }
    }
    
    // e.g myNs.MyType
    if (value.includes('.') || value.includes('+')) { 
      return NodeName.parseFullName(value) 
    }
    
    // e.g @myScope/myModule
    if (value.includes('/')) { 
      return { ...NodeName.parseImport(value) } 
    }
    
    // e.g MyType
    if (value[0] === value[0].toUpperCase()) { 
      return NodeName.parseFullName(value)
    }
    
    // e.g myModule
    // Could be a namespace, but we choose to treat it as an import
    // hence the name parseQualifiedTypeName, not just parseQualifiedName
    return { ...NodeName.parseImport(value) }
  }

  constructor(parts) {

    // module parts
    const { scope = GLOBAL, packageName, exports = [] } = parts
    assertAreScopeNames(scope, packageName, ...exports)
    this.scope = scope // e.g. myScope
    this.packageName = packageName // e.g. myModule
    this.exports = exports.length ? exports : undefined // e.g. myExport, mySubExport

    // full name parts
    const { namespaces = [], nestings = [], name } = parts
    assertAreScopeNames(...namespaces)
    assertAreTypeNames(...nestings)
    if (name)
      assert(isTypeName(name) || isScopeName(name))
    this.namespaces = namespaces.length ? namespaces : undefined
    this.nestings = nestings.length ? nestings : undefined
    this.name = name

    if (this.nestings && !isTypeName(name))
      throw new Error(`Expected TypeName, got "${name}".`)
  }
  
  get type() {
    if (this.isExportName) return 'export'
    if (this.isNamespace) return 'namespace'
    if (this.isTypeName) return 'type'
    throw new Error('Unknown type.')
  }
  
  get isExportName() { return !this.name }
  get isNamespace() { return isScopeName(this.name) }
  get isTypeName() { return isTypeName(this.name) }

  get isGlobal() { return this.scope === GLOBAL }
  get isScoped() { return !!this.scope && !this.isGlobal }

  get parentUrl() { return this.parent?.url }
  get parent() {
    if (this.nestings) {
      const nestings = [...this.nestings]
      const name = nestings.pop()
      return new NodeName({
        ...this.moduleParts,
        namespaces: this.namespaces,
        nestings: nestings.length ? nestings : undefined,
        name,
      })
    }

    if (this.namespaces) {
      const namespaces = [...this.namespaces]
      const name = namespaces.pop()
      return new NodeName({
        ...this.moduleParts,
        namespaces: namespaces.length ? namespaces : undefined,
        name,
      })
    }

    if (this.name) {
      return new NodeName({
        ...this.moduleParts
      })
    }

    if (this.exports) {
      const exports = [...this.exports]
      exports.pop()
      return new NodeName({
        ...this.moduleParts,
        exports: exports.length ? exports : undefined,
      })
    }

    return null
  }

  get moduleParts() {
    return { 
      scope: this.scope, 
      packageName: this.packageName, 
      exports: this.exports 
    }
  }

  get fullNameParts() {
    return { 
      namespaces: this.namespaces, 
      nestings: this.nestings, 
      name: this.name 
    }
  }

  get moduleName() { 
    return new NodeName({ 
      scope: this.scope, 
      packageName: this.packageName, 
      exports: this.exports 
    })
  }

  get pacakgeName() {
    return new NodeName({ 
      scope: this.scope,
      packageName: this.packageName,
    })
  }

  addExport(...exports) {
    return new ModuleName({ 
      scope: this.scope, 
      packageName: this.packageName,
      exports: [...(this.exports || []), ...exports] 
    })
  }

  addType(...names) {
    return new TypeName({ 
      ...this.moduleParts, 
      name: names.pop(), 
      namespaces: [...names],
    })
  }

  addNamespace(...names) {
    const namespaces = [...this.namespaces, ...[this.name], ...names]
    const name = namespaces.pop()
    return new TypeName({ 
      ...this.moduleParts, 
      namespaces: namespaces.length ? namespaces : undefined,
      name
    })
  }

  addName(...names) {
    const nestings = [...this.nestings, ...[this.name], ...names]
    const name = namespaces.pop()
    return new TypeName({ 
      ...this.moduleParts, 
      namespaces: this.namespaces,
      nestings: nestings.length ? nestings : undefined,
      name,
    })
  }

  get importString() {
    
    // e.g. myExport/mySubExport
    const path = [
      this.packageName, 
      ...(this.exports || [])
    ].filter(Boolean).join('/')

    // e.g. @myScope/myModule/myExport/mySubExport
    const result = this.isScoped 
      ? `@${this.scope}/${path}` 
      : path

    return result
  }

  get namespace() { return this.namespaces?.join('.') || null }
  get nesting() { return this.nestings?.join('+') || null }

  get fullName() {
    return [
      this.namespace,
      [
        this.nesting, 
        this.name
      ].filter(Boolean).join('+')
    ].filter(Boolean).join('.') || null
  }

  get qualifiedName() {
    return [
      this.importString, 
      this.fullName
    ].filter(Boolean).join(', ')
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
        this.scope, 
        this.packageName, 
        ...(this.exports || [])
      ].filter(Boolean).join('/'), 
      this.fullName
    ].filter(Boolean).join('#'))  
  }

  async import() { 
    if (!this.isExportName)
      throw new Error('Cannot import a non-export name.')
    return import(this.importString) 
  }

  async importJson() { 
    if (!this.isExportName)
      throw new Error('Cannot import a non-export name.')
    const module = await import(this.importString, JSON_IMPORT_OPTIONS)
    return module?.default 
  }

  async getType() {
    if (this.isExportName)
      return await this.import().default

    if (this.isNamespace)
      throw new Error('Cannot load a namespace as a type.')

    const scope = this.parent.isTypeName ?
      await this.parent.loadType() :
      await this.parent.loadNamespace()

    return await scope[this.name]
  }

  async getNamespace() {
    if (this.isExportName)
      return await this.import()

    if (this.isTypeName)
      throw new Error('Cannot load a type as a namespace.')

    const scope = this.parent.loadNamespace()
    return await scope[this.name]
  }

  toString() {
    return this.qualifiedName
  }
}

async function test() {
  const ids = [
    'nodejs://nodejs.org/myScope/myModule/myExport',
    'nodejs://nodejs.org/myScope/myModule/myExport#myNs.mySubNs.MyType+MyNestedType+MyNestedNestedType',
    'nodejs://nodejs.org/myScope/myModule#myNs.mySubNs.MyType+MyNestedType',
    'nodejs://nodejs.org/myScope/myModule#myNs.mySubNs.MyType',
    'nodejs://nodejs.org/myScope/myModule#myNs.MyType',
    'nodejs://nodejs.org/myScope/myModule#MyType',
    'nodejs://nodejs.org/myScope/myModule',
    'nodejs://nodejs.org/global/myModule',
    'nodejs://nodejs.org/global/my-module',
    'nodejs://nodejs.org/global/my_module',
    '@myScope/myModule, myNs.MyType',
    '@myScope/myModule, MyType',
    '@myScope/myModule',
    'myModule, myNs.MyType',
    'myModule, myNs.mySubNs',
    'myModule, myNs',
    'myModule, MyType',
    'myModule',
  ]
  for (var id of ids) {
    console.error(`-- ${id}`)
    const typeName = await NodeName.from(id)
    await typeName.__dump()
  }
}

test()
