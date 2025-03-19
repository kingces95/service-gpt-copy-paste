import { CliCommand } from '@kingjs/cli-command'
import { CliGroupOutput } from '@kingjs/cli-group-output'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { CliYargsCommand } from '@kingjs/cli-yargs'

const raw = {
  description: 'Dump Cli.getOwnMetadata()',
  parameters: { hierarchy: 'Walk and dump base classes, too.' },
  defaults: { hierarchy: false },
  handler: async function() {
    const { hierarchy } = this.options
    const class$ = await this.getClass()
    const pojo = !hierarchy ? class$.getOwnMetadata() 
      : [...class$.hierarchy()].map(o => o.getOwnMetadata())
    this.log(pojo)
  }
}
const md = {
  description: `Dump ${CliClassMetadata.name}`,
  parameters: { cached: 'Save and load metadata.' },
  defaults: { cached: false },
  handler: async function() {
    const { cached } = this.options
    if (cached) {
      const metadata = await this.getCachedMetadata()
      this.log(await metadata.toPojo())
      return
    }

    const metadata = await this.getMetadata()
    this.log(await metadata.toPojo())
  }
}
const info = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const info = await this.getInfo()
    this.log(await info.toPojo())
  }
}
const yargs = {
  description: `Dump ${CliYargsCommand.name}`,
  handler: async function() {
    const yargs = await this.getYargs()
    this.log(await yargs.toPojo())
  }
}
const ls = {
  description: 'List commands',
  handler: async function() {
    const info = await this.getInfo()
    for await (const command of info.commands())
      this.write(command.path)
  }
}
const find = {
  description: 'Find commands',
  handler: async function() {
    const walk = async (info) => {
      this.write(info.path)
      for await (const child of info.commands())
        await walk(child)
    }

    walk(await this.getInfo())
  }
}

export class CliSpy extends CliCommand {
  static description = 'Reflect on command metadata'
  static parameters = {
    path: 'Path of command',
  }
  static services = [ CliGroupOutput ]
  static commands = { 
    ls, find,
    raw, md,
    info, yargs,
  }
  static { this.initialize() }

  #path
  #nodeName
  #options

  constructor(path = [], options = {}) {
    if (CliSpy.initializing(new.target, path, options))
      return super()

    super(options)

    this.#path = path
    this.#options = options
  }

  get path() { return this.#path }
  get nodeName() { return this.#nodeName }
  get options() { return this.#options }

  async getScope() { 
    return await this.#options._root
  }
  async getClass() { 
    const scope = await this.getScope()
    return await scope.getCommand(this.#path)
  }
  async getMetadata() { 
    const class$ = await this.getClass()
    return await CliClassMetadata.fromClass(class$)
  }
  async getCachedMetadata() { 
    const metadata = await this.getMetadata()
    return await CliClassMetadata.fromMetadataPojo(await metadata.toPojo())
  }
  async getInfo() {
    const metadata = await this.getMetadata()
    return CliCommandInfo.fromMetadata(metadata)
  }
  async getYargs() {
    const info = await this.getInfo()
    return CliYargsCommand.fromInfoPojo(await info.toPojo())
  }
  log(pojo) {
    this.getService(CliGroupOutput).write(pojo)
  }
}

