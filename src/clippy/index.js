import _ from 'lodash'
import { Cli } from '@kingjs/cli'
// import CliYargs from '@kingjs/cli-yargs'
// import { cliInfoToPojo, toPojoSymbol } from '@kingjs/cli-info-to-pojo'
import { CliMetadataLoader } from '@kingjs/cli-metadata'
import { CliInfoLoader } from '@kingjs/cli-info'
import { CliYargsLoader } from '@kingjs/cli-yargs'

export default class Clippy extends Cli {
  static description = 'My funky cli'
  static commands = Clippy.loadCommands({
    http: '@kingjs/cli-http',
    // orb: '@kingjs/cli-orb',
    // poll: '@kingjs/cli-poll-clipboard',
    // eval: '@kingjs/cli-eval',
    // moo: {
    //   description: 'My moo command',
    //   commands: {
    //     foo: {
    //       description: 'My foo command',
    //       commands: {
    //         bar: '@kingjs/cli-orb',
    //       }
    //     },
    //   }
    // },
  })
  static defaults = Clippy.loadDefaults()

  constructor(options = { }) {
    if (Clippy.loadingDefaults(new.target, options))
      return super()

    super(options)
  }
}

const metadataLoader = new CliMetadataLoader(Clippy)
// loader.load().then(() => loader.__dump())
metadataLoader.load().then(async () => {
  // await metadataLoader.__dump()
  
  const metadata = await metadataLoader.toPojo()
  const infoLoader = new CliInfoLoader(metadata)
  // infoLoader.__dump()

  const info = await infoLoader.toPojo()
  const yargsLoader = new CliYargsLoader('clippy', info)
  yargsLoader.__dump()
})

// const yargsPojo = cliInfoPojoToYargs(infoPojo)
// console.log(JSON.stringify(yargsPojo, null, 2))

// const cli = new CliYargs(infoPojo)
// const { command: { [toPojoSymbol]: command }, args } = cli.parse()

// args[Cli.InfoSymbol] = command
// await command.run(args)

// node.exe src\clippy\index.js poll --error-rate .5 --poll-ms 1000 --stdis | node.exe src\clippy\index.js orb
