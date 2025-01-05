#!/usr/bin/env node

// import { CliShim } from '@kingjs/cli-loader'
// import { CliBashEval, CliCmdEval } from '@kingjs/cli-eval'
// import { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } from '@kingjs/cli-http'
// import CliPollClipboard from '@kingjs/cli-poll-clipboard'

// CliShim.run({
//   http: {
//     description$: 'Group of HTTP commands',
//     get: CliGet,
//     post: CliPost,
//     put: CliPut,
//     delete: CliDelete,
//     patch: CliPatch,
//     head: CliHead
//   },
//   eval: {
//     description$: 'Group of shell evaluation commands',
//     bash: CliBashEval,
//     cmd: CliCmdEval,
//     ps: CliCmdEval,
//     wsl: CliCmdEval,
//   },
//   poll: CliPollClipboard
// })
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

const CliGet = (argv) => console.log('HTTP GET Command', argv)
const CliPost = (argv) => console.log('HTTP POST Command', argv)
const CliPut = (argv) => console.log('HTTP PUT Command', argv)
const CliDelete = (argv) => console.log('HTTP DELETE Command', argv)
const CliPatch = (argv) => console.log('HTTP PATCH Command', argv)
const CliHead = (argv) => console.log('HTTP HEAD Command', argv)

const CliBashEval = (argv) => console.log('Bash Evaluation Command', argv)
const CliCmdEval = (argv) => console.log('CMD Evaluation Command', argv)
const CliPollClipboard = (argv) => console.log('Polling Clipboard Command', argv)

yargs(hideBin(process.argv))
  .command(
    'http <command>',
    'Group of HTTP commands',
    (httpYargs) => {
      httpYargs
        .command(
          'get',
          'HTTP GET request',
          (yargs) => {
            return yargs
              .option('url', {
                alias: 'u',
                type: 'string',
                describe: 'The URL to send the GET request to',
                demandOption: true
              })
              .option('headers', {
                alias: 'H',
                type: 'array',
                describe: 'Headers to include in the request',
                default: []
              })
          },
          CliGet
        )
        .command(
          'post',
          'HTTP POST request',
          (yargs) => {
            return yargs
              .option('url', {
                alias: 'u',
                type: 'string',
                describe: 'The URL to send the POST request to',
                demandOption: true
              })
              .option('body', {
                alias: 'b',
                type: 'string',
                describe: 'The body of the POST request',
                default: ''
              })
              .option('headers', {
                alias: 'H',
                type: 'array',
                describe: 'Headers to include in the request',
                default: []
              })
          },
          CliPost
        )
        .command('put', 'HTTP PUT request', {}, CliPut)
        .command('delete', 'HTTP DELETE request', {}, CliDelete)
        .command('patch', 'HTTP PATCH request', {}, CliPatch)
        .command('head', 'HTTP HEAD request', {}, CliHead)
        .demandCommand(1, 'You need to specify an HTTP command')
    }
  )
  .command(
    'eval <command>',
    'Group of shell evaluation commands',
    (evalYargs) => {
      evalYargs
        .command(
          'bash',
          'Evaluate a bash script',
          (yargs) => {
            return yargs.option('script', {
              alias: 's',
              type: 'string',
              describe: 'The bash script to evaluate',
              demandOption: true
            })
          },
          CliBashEval
        )
        .command('cmd', 'Evaluate a CMD script', {}, CliCmdEval)
        .command('ps', 'Evaluate a PowerShell script', {}, CliCmdEval)
        .command('wsl', 'Evaluate a WSL command', {}, CliCmdEval)
        .demandCommand(1, 'You need to specify an evaluation command')
    }
  )
  .command(
    'poll',
    'Poll the clipboard',
    (yargs) => {
      return yargs.option('interval', {
        alias: 'i',
        type: 'number',
        describe: 'Polling interval in milliseconds',
        default: 1000
      })
    },
    CliPollClipboard
  )
  .help()
  .argv;


// ./src/clippy/index.js
// !#/clipboard/', descr