import Lazy from '@kingjs/lazy'
import {
  CliClassInfo
} from '@kingjs/cli-loader'

class CliInfo {
  get name() { return this.name$ }
  get description() { throw new Error('Description is not implemented.') }

  constructor(loader, name, parent) {
    this.loader$ = loader
    this.name$ = name
    this.parent$ = parent

    this.hierarchy$ = Lazy.fromGenerator(function* () {
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

  *hierarchy() { yield* this.hierarchy$.value }
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

  get isParameter() { return true }
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
  static commonAncestor(members) {
    const classes = members.map(member => member.classInfo$.value)
    return CliClassInfo.commonAncestor(classes)
  }
  
  constructor(loader, name, parent) {
    super(loader, name, parent)

    this.classInfoHierarchy$ = Lazy.fromGenerator(function* () {
      const parentClassInfo = this.parent?.classInfo$.value
      for (const classInfo of this.classInfo$.value.hierarchy()) {
        if (parentClassInfo && classInfo === parentClassInfo) 
          break
        yield classInfo
      }
    }, this)

    this.parameters$ = Lazy.fromGenerator(function* () {
      for (const classInfo of [...this.classInfoHierarchy$.value].reverse()) {
        for (const classParameter of classInfo.parameters()) {
          yield CliParameterInfo.create(classParameter, this)
        }
      }
    }, this)
  }

  *parameters() { yield* this.parameters$.value }
  *options() { yield* this.parameters().filter(param => param.isOption) }
  *positionals() { yield* this.parameters().filter(param => param.isPositional) }

  get isMember() { return true }
}

class CliCommandInfo extends CliMemberInfo {
  static DefaultCommandName = '$'

  constructor(loader, cls, name, parent) {
    super(loader, name, parent)
    this.classInfo$ = new Lazy(() => this.loader.load(cls))
  }

  get isCommand() { return true }
  get isDefaultCommand() { return this.name === CliCommandInfo.DefaultCommandName }
  get description() { return this.classInfo$.value.description }

  run(args) { this.classInfo$.value.activate(args) }
}

class CliGroupInfo extends CliMemberInfo {
  constructor(loader, groupData, name, parent) {
    super(loader, name, parent)
    this.groupData = groupData

    this.members$ = Lazy.fromGenerator(function* () {
      for (const [name, clsOrGroup] of Object.entries(groupData)) {
        if (name.endsWith('$'))
          continue
        yield typeof clsOrGroup === 'function'
          ? new CliCommandInfo(loader, clsOrGroup, name, this)
          : new CliGroupInfo(loader, clsOrGroup, name, this)
      }
    }, this)
    
    this.classInfo$ = new Lazy(() => {
      return CliMemberInfo.commonAncestor([...this.members()])
    })
  }

  *groups() { yield* this.members().filter(member => member.isGroup) }
  *commands() { yield* this.members().filter(member => member.isCommand) }
  *members() { yield* this.members$.value }

  get isGroup() { return true }
  get defaultCommand() {
    for (const command of this.commands()) {
      if (command.isDefaultCommand) return command
    }
    return null
  }
  get description() { 
    return this.groupData.description$ 
      || this.defaultCommand?.description 
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
