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
  // const argv = await yargs.parse('http http:// 2 --stdis'.split(' '))
  const { _class, _positionals, _options } = await yargs.parse(hideBin(process.argv))
  new _class(..._positionals, _options)
})

// node.exe src\clippy\index.js poll --error-rate .5 --poll-ms 1000 --stdis | node.exe src\clippy\index.js orb
