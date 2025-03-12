import _ from 'lodash'
import yargs from 'yargs'
import { Lazy } from '@kingjs/lazy'
import { Cli } from '@kingjs/cli'
import { CliMetadataLoader } from '@kingjs/cli-metadata'
import { CliCommandInfo, CliInfoLoader } from '@kingjs/cli-info'
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
  #description

  constructor(name, description) {
    this.#name = name
    this.#description = description ?? '<not yet described>'
  }

  get name() { return this.#name }
  get description() { return this.#description }

  async toPojo() {
    const { toPojo } = await __import()
    return await toPojo(this)
  }
  
  async __dump() {
    return dumpPojo(await this.toPojo())
  }
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
    return this.#positional.isOptional
      || this.#positional.type === 'array'
  }
}

export class CliYargsOption extends CliYargsParameter {
  #option

  constructor(command, name, option) {
    super(command, name, option)

    this.#option = option
  } 

  get local() { return this.#option.isLocal }

  get demandOption() { return this.#option.isRequired }
  get global() { return !this.#option.isLocal }
  get hidden() { return this.#option.isHidden }
}

export class CliYargsCommand extends CliYargs {
  #parameters     // array of CliYargsParameter
  #scope          // CliYargsCommand
  #commands       // array of CliYargsCommand
  #template       // yargs command string
  #path           // path to command

  constructor(commandInfo, scope, name = '.') {
    super(name, commandInfo.description)
    
    this.#scope = scope

    this.#parameters = new Lazy(() => {
      const parameters = [ ]
      for (const [name, parameter] of Object.entries(commandInfo.parameters ?? { })) {
        if (KNONWN_OPTIONS.includes(name))
          continue
        parameters.push(CliYargsParameter.create(this, name, parameter))
      }
      return parameters
    })

    this.#commands = new Lazy(() => {
      const commands = [ ]
      for (const [name, command] of Object.entries(commandInfo.commands ?? { })) {
        commands.push(new CliYargsCommand(command, this, name))
      }
      return commands
    })

    this.#template = new Lazy(() => {
      // todo: handle groups
      // `${name} <command>`,

      const parts = [name]
      for (const positional of this.positionals()) {
        const part = positional.isOptional 
          ? `[${positional.name}]` : `<${positional.name}>`
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

  async apply(yargs) {
    for (const positional of this.positionals()) {
      yargs.positional(positional.name, await positional.toPojo())
    }

    for (const option of this.options()) {
      yargs.option(option.name, await option.toPojo())
      // yargs.group(name, `Options (${group}):`)
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
      .sort((a, b) => a.parameter.position - b.parameter.position) 
  }
  *options() { 
    // options sorted by name
    yield* this.#parameters.value
      .filter(o => o instanceof CliYargsOption)
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}

export async function cliYargs(classOrPojo) {
  const class$ = typeof classOrPojo == 'function' 
    ? classOrPojo : Cli.extend(classOrPojo)

  const metadataClassLoader = CliMetadataLoader.load(class$)
  const classMetadata = await metadataClassLoader.toPojo()

  const metadataLoader = CliMetadataLoader.load(classMetadata)
  const infoLoader = new CliInfoLoader(metadataLoader)
  const infos = await infoLoader.toPojo()
  
  const yargs$ = yargs()
    .middleware(async (argv) => {
      if (argv['metadata$']) {
        dumpPojo(await metadataLoader.toPojo())
        process.exit(0)
      }
    })
    .middleware(async (argv) => {
      if (argv['infos$']) {
        dumpPojo(await infoLoader.toPojo())
        process.exit(0)
      }
    })
    .middleware(async (argv) => ({ 
      _info: await infoLoader.getCommand(argv._),
    }))
    .middleware(async (argv) => ({ 
      _parameters: [...CliCommandInfo.runtimeParameters(argv._info)],
    }))
    .middleware(async (argv) => ({ 
      _positionals: [...argv._parameters.filter(o => o.isPositional)]
        .sort((a, b) => a.position - b.position)
        .reduce((acc, { name }) => {
          acc.push(argv[name])
          return acc
        }, [ ]),
      _options: [...argv._parameters.filter(o => o.isOption)]
        .reduce((acc, { name }) => {
          if (Object.hasOwn(argv, name))
            acc[name] = argv[name]
        }, { })
    }))
    .middleware(async (argv) => {
      if (argv['argv$']) {
        dumpPojo(await toPojo(argv))
        process.exit(0)
      }
    })
    .middleware(async (argv) => ({ 
      _class: await class$.getCommand(argv._),
    }))
    .middleware(async (argv) => {
      if (argv['metadata-declared$']) {
        const hierarchyFn = (cli) => cli ? [cli, ...hierarchyFn(cli.baseCli)] : []
        const hierarchy = hierarchyFn(argv._class).reverse().map(o => o.getOwnMetadata())
        const pojo = await toPojo(hierarchy, { type: 'infos' })
        dumpPojo(pojo)
        process.exit(0)
      }
    })
    .middleware(async (argv) => {
      if (argv['info-metadata$']) {
        const metadataLoader = CliMetadataLoader.load(argv._class)
        await metadataLoader.__dump()
        process.exit(0)
      }
    })
    .middleware(async (argv) => {
      if (argv['info$']) {
        const metadataLoader = CliMetadataLoader.load(argv._class)
        const metadata = await metadataLoader.toPojo()
        const infoLoader = new CliInfoLoader(metadata)
        await infoLoader.__dump()
        process.exit(0)
      }
    })
    .middleware(async (argv) => {
      if (argv['info-yargs$']) {
        const metadataLoader = CliMetadataLoader.load(argv._class)
        const metadata = await metadataLoader.toPojo()
        const infoLoader = new CliInfoLoader(metadata)
        const infos = await infoLoader.toPojo()
        const yargsCommand = new CliYargsCommand(infos)
        await yargsCommand.__dump()
        process.exit(0)
      }
    })

  const yargsCommand = new CliYargsCommand(infos)
  return yargsCommand.apply(yargs$)
}

