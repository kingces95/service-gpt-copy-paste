import assert from 'assert'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { LoadAsync, LoadAsyncGenerator } from '@kingjs/load'
import { TypeName } from '@kingjs/node-name'

class CliInfo {
  constructor(name, parent) {
    this.name$ = name
    this.parent$ = parent

    this.hierarchy$ = new LoadAsyncGenerator(async function* () {
      let current = this
      while (current) {
        yield current
        current = current.parent
      }
    }, this)
  }

  get isDefaultCommand() { return false }
  get isMember() { return false }
  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }

  get name() { return this.name$ }
  get parent() { return this.parent$ }
  async hierarchy() { return await this.hierarchy$.load() }

  async description() { throw new Error('Description is not implemented.') }

  toString() { return this.name }
}

class CliParameterInfo extends CliInfo {
  constructor(mdParameter, parent) {
    super(mdParameter.name, parent)
    this.mdParameter = mdParameter

    // List of properties to define as getters
    const properties = [
      'position', 'isParameter', 'isPositional', 'isOption',
      'description', 'normalize',
      'default', 'hasDefault', 'required', 'defaultDescription',
      'aliases', 'choices', 'conflicts', 'implies',
      'type', 'isString', 'isBoolean', 'isNumber', 'isArray',
      'isCount', 'global', 'hidden'
    ]

    // Dynamically define getters
    for (const prop of properties) {
      Object.defineProperty(this, prop, {
        get: () => this.mdParameter[prop],
        enumerable: true
      })
    }
  }
}

class CliMemberInfo extends CliInfo {
  static async create(groupOrClsOrModuleName, name, parent) {
    const group = groupOrClsOrModuleName
    if (typeof group == 'object') {
      return new CliGroupInfo(group, name, parent)
    }

    const clsOrModuleName = groupOrClsOrModuleName
    if (typeof clsOrModuleName == 'function' || typeof clsOrModuleName == 'string') {
      return new CliCommandInfo(clsOrModuleName, name, parent)
    }

    assert('Bad CliMemberInfo activation arguments')
  }

  static async commonAncestor(members) {
    const classes = await Promise.all(members.map(async member => await member.mdClass$.load()))
    return await CliClassMetadata.commonAncestor(classes)
  }
  
  constructor(name, parent) {
    super(name, parent)

    this.mdClassHierarchy$ = new LoadAsyncGenerator(async function* () {
      const parentMetaClass = await this.parent?.mdClass$.load()
      for (const mdClass of await this.mdClass$.load(async o => await o.hierarchy())) {
        if (parentMetaClass && mdClass === parentMetaClass) 
          break
        yield mdClass
      }
    }, this)

    this.parameters$ = new LoadAsyncGenerator(async function* () {
      for (const mdClass of (await this.mdClassHierarchy$.load()).reverse()) {
        for (const mdParameter of mdClass.parameters()) {
          yield new CliParameterInfo(mdParameter, this)
        }
      }
    }, this)
  }

  get isMember() { return true }

  async parameters() { return await this.parameters$.load() }
  async options() { return (await this.parameters()).filter(param => param.isOption) }
  async positionals() { return (await this.parameters()).filter(param => param.isPositional) }
}

class CliCommandInfo extends CliMemberInfo {
  static DefaultCommandName = '$'

  constructor(clsOrModuleName, name, parent) {
    super(name, parent)
    this.mdClass$ = new LoadAsync(async () => {
      const typeName = clsOrModuleName
      if (typeof typeName == 'string') {
        clsOrModuleName = await TypeName.load(typeName, { typeMissingIsError: true })
      }

      const cls = clsOrModuleName
      assert(typeof cls == 'function', `Expected function but got ${typeof cls}: ${cls}`)
      return cls.metadata
    })
  }

  get isDefaultCommand() { return this.name === CliCommandInfo.DefaultCommandName }
  
  async description() { return await this.mdClass$.load(o => o.description) }
  async run(args) { return await this.mdClass$.load(o => o.activate(args)) }
}

class CliGroupInfo extends CliMemberInfo {
  
  constructor(groupData, name, parent) {
    super(name, parent)
    this.groupData = groupData

    this.commands$ = new LoadAsyncGenerator(async function* () {
      for (const [name, clsOrGroupOrModuleName] of Object.entries(groupData)) {
        if (name.endsWith('$'))
          continue
        yield CliMemberInfo.create(clsOrGroupOrModuleName, name, this)
      }
    }, this)
    
    this.mdClass$ = new LoadAsync(async () => {
      return await CliMemberInfo.commonAncestor(await this.commands())
    })
  }

  async commands() { return this.commands$.load() }
 
  async defaultCommand() {
    for (const command of await this.commands()) {
      if (command.isDefaultCommand) 
        return command
    }
    return null
  }
  async description() { 
    return this.groupData.description$ 
      || await (await this.defaultCommand())?.description() 
      || '<missing group description>'
  }
}

export {
  CliInfo,
  CliParameterInfo,
  CliMemberInfo,
  CliCommandInfo,
  CliGroupInfo
}
