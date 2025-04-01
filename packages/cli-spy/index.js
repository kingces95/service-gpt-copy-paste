import { CliRuntime } from '@kingjs/cli-runtime'
import { CliCommand, CliConsole } from '@kingjs/cli-command'
import { CliOutputService } from '@kingjs/cli-output-service'
import { CliClassMetadata } from '@kingjs/cli-metadata'
import { CliCommandInfo } from '@kingjs/cli-info'
import { CliYargsCommand } from '@kingjs/cli-yargs'

const raw = {
  description: 'Dump Cli.ownMetadata',
  handler: async function() {
    const command = await this.getCommand()
    const pojo = [...command.hierarchy()].map(o => o.ownMetadata)
    this.log(pojo)
  }
}
const md = {
  description: `Dump ${CliClassMetadata.name}`,
  handler: async function() {
    const metadata = await this.getMetadata()
    this.log(await metadata.toPojo())
  }
}
const cachedMd = {
  description: `Dump cached ${CliClassMetadata.name}`,
  handler: async function() {
    const metadata = await this.getCachedMetadata()
    this.log(await metadata.toPojo())
  }
}
const mdParams = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const md = await this.getMetadata()
    for await (const classMd of md.classes()) {
      for await (const paramMd of classMd.parameters())
        await this.console.echoRecord([paramMd.name, classMd.name])
    }
  }
}
const json = {
  description: `Dump ${CliClassMetadata.name}.toPojo()`,
  handler: async function() {
    const metadata = await this.getCachedMetadata()
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
const params = {
  description: `Dump ${CliCommandInfo.name}`,
  handler: async function() {
    const info = await this.getInfo()
    const dumpParams = async (info) => {
      for await (const parameter of info.parameters())
        await this.console.echoRecord([info.name, parameter.name])
      for await (const command of info.commands())
        await dumpParams(command)
    }
    await dumpParams(info)
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
  static services = { 
    format: CliOutputService, 
    console: CliConsole
  }
  static commands = { 
    ls, find,
    raw, md, cachedMd, json,
    info, yargs, params, mdParams
  }
  static { this.initialize(import.meta) }

  #path

  constructor(path = [], options = {}) {
    if (CliSpy.initializing(new.target, path, options))
      return super()

    super(options)

    this.#path = path
  }

  get path() { return this.#path }

  async getCommand() { 
    const { runtime } = this.info
    const { class: class$ } = await runtime.getCommand(...this.#path)
    return class$
  }
  async getMetadata() { 
    const command = await this.getCommand()
    return await CliClassMetadata.fromClass(command)
  }
  async getCachedMetadata() { 
    const metadata = await this.getMetadata()
    return await CliClassMetadata.fromMetadataPojo(await metadata.toPojo())
  }
  async getInfo() {
    const metadata = await this.getCachedMetadata()
    return CliCommandInfo.fromMetadata(metadata)
  }
  async getYargs() {
    const info = await this.getInfo()
    return CliYargsCommand.fromInfoPojo(await info.toPojo())
  }
  
  write(string) {
    this.console.echo(string)
  }
  log(pojo) {
    const service = this.format
    service.write(pojo)
  }
}

