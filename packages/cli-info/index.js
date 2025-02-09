import assert from 'assert'
import { CliClassInfo } from '@kingjs/cli-loader'
import { LoadAsync, LoadAsyncGenerator } from '@kingjs/load'
import { TypeName, ModuleName } from '@kingjs/node-name'

class CliInfo {
  constructor(loader, name, parent) {
    this.loader$ = loader
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

  get isGroup() { return false }
  get isCommand() { return false }
  get isDefaultCommand() { return false }
  get isMember() { return false }
  get isParameter() { return false }
  get isPositional() { return false }
  get isOption() { return false }

  get parent() { return this.parent$ }
  get loader() { return this.loader$ }
  get name() { return this.name$ }

  async description() { throw new Error('Description is not implemented.') }

  async hierarchy() { return await this.hierarchy$.load() }
  toString() { return this.name }
}

class CliParameterInfo extends CliInfo {
  static create(classParameter, parent) {
    if (classParameter.isOption) return new CliOptionInfo(classParameter, parent)
    if (classParameter.isPositional) return new CliPositionalInfo(classParameter, parent)
    throw new Error(`Invalid parameter type: ${classParameter}`)
  }

  constructor(classParameter, parent) {
    super(classParameter.loader, classParameter.name, parent)
    this.classParameter = classParameter
  }

  get isParameter() { return true }

  get aliases() { return this.classParameter?.aliases }
  get choices() { return this.classParameter?.choices }
  get conflicts() { return this.classParameter?.conflicts }
  get default() { return this.classParameter?.default }
  get defaultDescription() { return this.classParameter?.defaultDescription }
  get implies() { return this.classParameter?.implies }
  get isNormalized() { return this.classParameter?.isNormalized }
  get type() { return this.classParameter?.type }
  get isString() { return this.classParameter?.type === 'string' }
  get isBoolean() { return this.classParameter?.type === 'boolean' }
  get isNumber() { return this.classParameter?.type === 'number' }
  get description() { return this.classParameter?.description }
}

class CliPositionalInfo extends CliParameterInfo {
  get isPositional() { return true }

  get position() { return this.classParameter?.position }
}

class CliOptionInfo extends CliParameterInfo {
  get isOption() { return true }
  
  get isDemandOption() { return this.classParameter?.isDemandOption }
  get isGlobal() { return this.classParameter?.isGlobal }
  get isHidden() { return this.classParameter?.isHidden }
  get isArray() { return this.classParameter?.type === 'array' }
  get isCount() { return this.classParameter?.type === 'count' }
}

class CliMemberInfo extends CliInfo {
  static async create(loader, groupOrClsOrModuleName, name, parent) {
    const group = groupOrClsOrModuleName
    if (typeof group == 'object') {
      return new CliGroupInfo(loader, group, name, parent)
    }

    const clsOrModuleName = groupOrClsOrModuleName
    if (typeof clsOrModuleName == 'function' || typeof clsOrModuleName == 'string') {
      return new CliCommandInfo(loader, clsOrModuleName, name, parent)
    }

    assert('Bad CliMemberInfo activation arguments')
  }

  static async commonAncestor(members) {
    const classes = await Promise.all(members.map(async member => await member.classInfo$.load()))
    return await CliClassInfo.commonAncestor(classes)
  }
  
  constructor(loader, name, parent) {
    super(loader, name, parent)

    this.classInfoHierarchy$ = new LoadAsyncGenerator(async function* () {
      const parentClassInfo = await this.parent?.classInfo$.load()
      for (const classInfo of await this.classInfo$.load(async o => await o.hierarchy())) {
        if (parentClassInfo && classInfo === parentClassInfo) 
          break
        yield classInfo
      }
    }, this)

    this.parameters$ = new LoadAsyncGenerator(async function* () {
      for (const classInfo of (await this.classInfoHierarchy$.load()).reverse()) {
        for (const classParameter of classInfo.parameters()) {
          yield CliParameterInfo.create(classParameter, this)
        }
      }
    }, this)
  }

  async parameters() { return await this.parameters$.load() }
  async options() { return (await this.parameters()).filter(param => param.isOption) }
  async positionals() { return (await this.parameters()).filter(param => param.isPositional) }

  get isMember() { return true }
}

class CliCommandInfo extends CliMemberInfo {
  static DefaultCommandName = '$'

  constructor(loader, clsOrTypeName, name, parent) {
    super(loader, name, parent)
    this.classInfo$ = new LoadAsync(async () => {
      const typeName = clsOrTypeName
      if (typeof typeName == 'string') {
        clsOrTypeName = await TypeName.load(typeName, { typeMissingIsError: true })
      }

      const cls = clsOrTypeName
      assert(typeof cls == 'function', `Expected function but got ${typeof cls}: ${cls}`)
      return this.loader.load(cls)
    })
  }

  get isCommand() { return true }
  get isDefaultCommand() { return this.name === CliCommandInfo.DefaultCommandName }
  
  async description() { return await this.classInfo$.load(o => o.description) }
  async run(args) { return await this.classInfo$.load(o => o.activate(args)) }
}

class CliGroupInfo extends CliMemberInfo {
  
  constructor(loader, groupData, name, parent) {
    super(loader, name, parent)
    this.groupData = groupData

    this.members$ = new LoadAsyncGenerator(async function* () {
      for (const [name, clsOrGroupOrModuleName] of Object.entries(groupData)) {
        if (name.endsWith('$'))
          continue
        yield CliMemberInfo.create(loader, clsOrGroupOrModuleName, name, this)
      }
    }, this)
    
    this.classInfo$ = new LoadAsync(async () => {
      return await CliMemberInfo.commonAncestor(await this.members())
    })
  }

  async groups() { return (await this.members()).filter(member => member.isGroup) }
  async commands() { return (await this.members()).filter(member => member.isCommand) }
  async members() { return this.members$.load() }

  get isGroup() { return true }
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
  CliPositionalInfo,
  CliOptionInfo,
  CliMemberInfo,
  CliCommandInfo,
  CliGroupInfo
}
