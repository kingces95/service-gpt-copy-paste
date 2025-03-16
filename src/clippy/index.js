import { cliYargs } from '@kingjs/cli-yargs'
import { hideBin } from 'yargs/helpers'

cliYargs({
  name: 'Clippy',
  description: 'My funky cli',
  commands: {
    http: '@kingjs/cli-http',
    orb: '@kingjs/cli-orb',
    poll: '@kingjs/cli-poll-clipboard',
    eval: '@kingjs/cli-eval',
  }
}).then(async (yargs) => {
  const toolName = 'clippy'
  yargs = yargs
    .scriptName(toolName)
    .usage(`${toolName} <command> [options]`)
    .wrap(85)

  const argv = await yargs.parse('--argv$'.split(' '))
  // const argv = await yargs.parse(hideBin(process.argv))
  new argv._class(...argv._args)
})

// node.exe src\clippy\index.js poll --error-rate .5 --poll-ms 1000 --stdis | node.exe src\clippy\index.js orb
