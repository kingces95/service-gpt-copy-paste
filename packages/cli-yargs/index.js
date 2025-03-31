import _ from 'lodash'
import yargs from 'yargs'
import { Lazy } from '@kingjs/lazy'
import { dumpPojo } from '@kingjs/pojo-dump'
import { toPojo } from '@kingjs/pojo'

async function __import() {
  const { cliYargsToPojo } = await import('@kingjs/cli-yargs-to-pojo')
  return { toPojo: cliYargsToPojo }
}

const KNONWN_OPTIONS = [
  'help', 'version'
]

export class CliYargs {
  #name

  constructor(name) {
    this.#name = name
  }

  get name() { return this.#name }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(this)
  }
  
  async __dump() {
    return dumpPojo(await this.toPojo())
  }
}

export class CliYargsParameter extends CliYargs {
  static create(scope, name, pojo) {
    if (pojo.position !== undefined)
      return new CliYargsPositional(scope, name, pojo)
    return new CliYargsOption(scope, name, pojo)
  }

  #pojo
  #scope
  #name

  constructor(scope, name, pojo) {
    super(name)
    this.#scope = scope
    this.#name = name
    this.#pojo = pojo
  }

  get isPositional() { return this.#pojo.position !== undefined }
  get isOption() { return this.#pojo.position === undefined }

  get command() { return this.#scope }
  get name() { return this.#name }
  get description() { return this.#pojo.description }

  // abstract properties
  get position() { return undefined }
  get demandOption() { return undefined }
  get global() { return undefined }
  get hidden() { return undefined }

  // https://github.com/yargs/yargs/blob/main/docs/api.md#positionalkey-opt
  // https://github.com/yargs/yargs/blob/main/docs/api.md#optionskey-opt
  get alias() { return this.#pojo?.aliases }
  get choices() { return this.#pojo?.choices }
  get coerce() { return this.#pojo?.coerce }
  get conflicts() { return this.#pojo?.conflicts }
  get default() { return this.#pojo?.default }
  get defaultDescription() { return this.#pojo?.defaultDescription }
  get implies() { return this.#pojo?.implies }
  get normalize() { return this.#pojo?.normalize }
  get type() { return this.#pojo?.type }
}

export class CliYargsPositional extends CliYargsParameter {
  #pojo

  constructor(scope, name, pojo) {
    super(scope, name, pojo)

    this.#pojo = pojo
  }

  get position() { return this.#pojo.position }
  get isOptional() { return this.#pojo.isOptional }
  get isVariadic() { return this.#pojo.isVariadic }
}

export class CliYargsOption extends CliYargsParameter {
  #pojo

  constructor(scope, name, pojo) {
    super(scope, name, pojo)

    this.#pojo = pojo
  } 

  get demandOption() { return this.#pojo.isRequired }
  get global() { return !this.#pojo.isLocal }
  get hidden() { return this.#pojo.isHidden }
  get group() { return this.#pojo.group }
}

export class CliYargsCommand extends CliYargs {
  static fromInfoPojo(pojo) {
    return new CliYargsCommand(null, null, pojo)
  }

  #scope          // CliYargsCommand
  #pojo           // CliCommandInfo pojo
  #parameters     // array of CliYargsParameter
  #commands       // array of CliYargsCommand
  #template       // yargs command string
  #path           // path to command

  constructor(scope, name = '.', pojo) {
    super(name, pojo.description)
    
    this.#pojo = pojo
    this.#scope = scope

    this.#parameters = new Lazy(() => {
      const parameters = [ ]
      for (const [name, parameter] of Object.entries(pojo.parameters ?? { })) {
        // if (KNONWN_OPTIONS.includes(name))
        //   continue
        const kababName = parameter.kababName ?? name
        parameters.push(CliYargsParameter.create(this, kababName, parameter))
      }
      return parameters
    })

    this.#commands = new Lazy(() => {
      const commands = [ ]
      for (const [name, command] of Object.entries(pojo.commands ?? { })) {
        const kababName = command.kababName ?? name
        commands.push(new CliYargsCommand(this, kababName, command))
      }
      return commands
    })

    this.#template = new Lazy(() => {
      const positionals = [name]
      for (const positional of this.positionals()) {
        const variadic = positional.isVariadic ? '...' : ''
        const part = positional.isOptional 
          ? `[${positional.name}${variadic}]` 
          : `<${positional.name}${variadic}>`
        positionals.push(part)
      }

      return positionals.join(' ')
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
  get description() { return this.#pojo.description }
  get demandCommand() { 
    return this.#commands.value.length > 0 && !this.#pojo.isDefaultCommand
  }

  async apply(yargs) {
    yargs.strict()

    if (this.demandCommand)
      yargs.demandCommand(1, 'You must specify a command.')

    for (const positional of this.positionals()) {
      const pojo = await positional.toPojo()
      yargs.positional(positional.name, pojo)
    }

    for (const option of this.options()) {
      const name = option.name
      // if (name == 'stdlog') continue
      const pojo = await option.toPojo()
      // console.log(`-${this.name}:${name} (${pojo.group})`)
      delete pojo.group
      if (!KNONWN_OPTIONS.includes(name)) yargs.option(name, pojo)
      yargs.group(name, option.group ? `Options (${option.group}):` : 'Options:')
    }

    for (const child of this.commands()) {
      yargs.command(
        child.template, 
        child.description, 
        child.apply.bind(child),
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
      .sort((a, b) => a.position - b.position) 
  }
  *options() { 
    // options sorted by name
    yield* this.#parameters.value
      .filter(o => o instanceof CliYargsOption)
  }
}

export function cliYargs(pojo) {
  const yargsCommand = CliYargsCommand.fromInfoPojo(pojo)
  
  const yargs$ = yargs()
    .alias('help', 'h')
    .alias('version', 'v')
    .demandCommand(1, 'You must specify a command.')
    .showHelpOnFail(false, "Run --help for details.")
    .option('argv$', { hidden: true })
    .middleware(async (argv) => {
      if (argv['argv$']) {
        const pojo = await toPojo(argv)
        await dumpPojo(pojo)
        process.exit(0)
      }
    })

  return yargsCommand.apply(yargs$)
}
