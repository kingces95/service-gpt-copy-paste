import _ from 'lodash'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { Lazy } from '@kingjs/lazy'
async function __import() {
  const { cliYargsToPojo } = await import('@kingjs/cli-yargs-to-pojo')
  const { dumpPojo } = await import('@kingjs/pojo-dump')
  return { toPojo: cliYargsToPojo, dumpPojo }
}

export class CliYargs {
  #name
  #description

  constructor(name, description) {
    this.#name = name
    this.#description = description
  }

  get name() { return this.#name }
  get description() { return this.#description }
}

export class CliYargsParameter extends CliYargs {
  static create(command, name, parameter) {
    if (parameter.position !== undefined)
      return new CliYargsPositional(command, name, parameter)
    return new CliYargsOption(command, name, parameter)
  }

  #command
  #name
  #parameter

  constructor(command, name, parameter) {
    super(name, parameter.description)
    this.#command = command
    this.#name = name
    this.#parameter = parameter
  }

  get isPositional() { return this.#parameter.position !== undefined }
  get isOption() { return this.#parameter.position === undefined }

  get command() { return this.#command }
  get name() { return this.#name }
  get parameter() { return this.#parameter }

  // abstract properties
  get position() { return undefined }
  get demandOption() { return undefined }
  get global() { return undefined }
  get hidden() { return undefined }

  // https://github.com/yargs/yargs/blob/main/docs/api.md#positionalkey-opt
  // https://github.com/yargs/yargs/blob/main/docs/api.md#optionskey-opt
  get alias() { return this.#parameter?.aliases }
  get choices() { return this.#parameter?.choices }
  get coerce() { return this.#parameter?.coerce }
  get conflicts() { return this.#parameter?.conflicts }
  get default() { return this.#parameter?.default }
  get defaultDescription() { return this.#parameter?.defaultDescription }
  get implies() { return this.#parameter?.implies }
  get normalize() { return this.#parameter?.normalize }
  get type() { return this.#parameter?.type }
}

export class CliYargsPositional extends CliYargsParameter {
  #positional

  constructor(command, name, positional) {
    super(command, name, positional)

    this.#positional = positional
  }

  get position() { return this.#positional.position }
  get isOptional() {
    return this.#positional.default !== undefined
      || this.#positional.type === 'array'
  }
}

export class CliYargsOption extends CliYargsParameter {
  #option

  constructor(command, name, option) {
    super(command, name, option)

    this.#option = option
  } 

  get local() { return this.#option?.isLocal }

  get demandOption() { return this.#option?.demandOption }
  get global() { return !this.#option?.isLocal }
  get hidden() { return this.#option?.isHidden }
}

export class CliYargsCommand extends CliYargs {
  #parameters     // array of CliYargsParameter
  #scope          // CliYargsCommand
  #commands       // array of CliYargsCommand
  #template       // yargs command string
  #path           // path to command

  constructor(name, commandInfo, scope) {
    super(name, commandInfo.description)
    
    this.#scope = scope

    this.#parameters = new Lazy(() => {
      const parameters = [ ]
      for (const [name, parameter] of Object.entries(commandInfo.parameters ?? { })) {
        parameters.push(CliYargsParameter.create(this, name, parameter))
      }
      return parameters
    })

    this.#commands = new Lazy(() => {
      const commands = [ ]
      for (const [name, command] of Object.entries(commandInfo.commands ?? { })) {
        commands.push(new CliYargsCommand(name, command, this))
      }
      return commands
    })

    this.#template = new Lazy(() => {
      // todo: handle groups
      // `${name} <command>`,

      const parts = [name]
      for (const positional of this.positionals()) {
        const part = positional.isOptional 
          ? `[${positional.name}...]` : `<${positional.name}>`
        parts.push(part)
      }
      return parts.join(' ')
    })

    this.#path = new Lazy(() => {
      return [...this.hierarchy()].reverse().map(o => o.name).join(' ')
    })
  }

  *hierarchy() { 
    var scope = this
    while (scope) {
      yield scope
      scope = scope.scope
    }
  }

  get scope() { return this.#scope }
  get template() { return this.#template.value }
  get path() { return this.#path.value }

  parse(yargs, handler) {
    for (const positional of this.positionals()) {
      yargs.positional(positional.name, positional)
    }

    for (const option of this.options()) {
      yargs.option(option.name, option)
      // yargs.group(name, `Options (${group}):`)
    }

    for (const child of this.commands()) {
      yargs.command(
        child.template, 
        child.description, 
        (subYargs) => child.build(subYargs, handler),
        (argv) => handler(child.path, argv)
      )
    }

    return yargs
  }

  *commands() { yield* this.#commands.value }
  *parameters() { yield* this.#parameters.value }
  *positionals() {
    // inherited and declared positionals sorted by position
    yield* this.scope?.positionals() ?? []
    yield* this.#parameters.value
      .filter(o => o instanceof CliYargsPositional)
      .sort((a, b) => a.parameter.position - b.parameter.position) 
  }
  *options() { 
    // options sorted by name
    yield* this.#parameters.value
      .filter(o => o instanceof CliYargsOption)
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}

export class CliYargsLoader {
  #command

  constructor(name = 'acme', info) {
    this.#command = new CliYargsCommand(name, info)
  }

  get command() { return this.#command }

  parse(argv = hideBin(process.argv), handler = (path, argv) => { 
    console.error({ path, argv })
  }) {
    this.#command.parse(yargs(argv), handler)
  }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(this.#command)
  }
  
  async __dump() {
    const { dumpPojo } = await __import()
    await dumpPojo(await this.toPojo())
  }
}

