#!/usr/bin/env node
import { Cli } from '@kingjs/cli'

export const Clippy = Cli.extend({
  name: 'Clippy',
  description: 'My funky cli',
  commands: {
    http: '@kingjs/cli-http',
    orb: '@kingjs/cli-orb',
    poll: '@kingjs/cli-poll-clipboard',
    eval: '@kingjs/cli-eval',
  }
})

export default Clippy