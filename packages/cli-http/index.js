#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import axios from 'axios'
import { fromReadline } from '@kingjs/rx-from-readline'
import readline from 'readline/promises'
import { reduce } from 'rxjs/operators'

class CliHttp extends Cli {
  static metadata = Object.freeze({
    description: 'Send a HTTP request',
    arguments: [
      { name: 'url', describe: 'The URL to request', type: 'string', demandOption: true }
    ],
    options: {
      headers: { type: 'number', describe: 'Number of lines devoted to HTTP headers in stdin', default: 0 }
    }
  })

  constructor({ url, headers, signal, method, isUpdate, ...rest }) {
    super({ signal, ...rest })

    // Activate readline interface
    const readlineInterface = readline.createInterface({ input: this.stdin })

    // Create an observable from readline using @kingjs/rx-from-readline
    const lines$ = fromReadline(readlineInterface)

    // Process headers and body, then execute
    CliHttp.processLines(lines$, headers, isUpdate).then(async ({ headers, body }) => {
      try {
        const response = await axios({
          url,
          method,
          headers,
          data: body || undefined,
          signal,
          responseType: 'stream',
          validateStatus: () => true
        })

        response.data.pipe(this.stdout)

        response.data.on('error', (error) => {
          this.stderr.write(`Stream error: ${error.message}\n`)
          this.error$(error)
        })

        response.data.on('end', () => {
          if (response.status >= 200 && response.status < 300) {
            this.success$()
          } else {
            this.stderr.write(`HTTP request failed with status ${response.status}: ${response.statusText}\n`)
            this.failure$()
          }
        })
      } catch (error) {
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
          this.aborted$()
        } else {
          this.stderr.write(`Network error: ${error.message}\n`)
          this.error$(error)
        }
      }
    }).catch(err => this.error$(err))
  }

  static async processLines(lines$, headersCount, isUpdate) {
    if (headersCount === 0 && !isUpdate) {
      return Promise.resolve({ headers: undefined, body: undefined })
    }

    const headerRecord = new Record(['key', 'value'])
    return lines$.pipe(
      reduce((acc, line, index) => {
        if (index < headersCount) {
          // Use Record to parse header lines
          const { key, value } = headerRecord.split(line)
          acc.headers[key.trim()] = value?.trim() || ''
        } else {
          // Lazily create the body accumulator array
          acc.body = acc.body || []
          acc.body.push(line)
        }
        return acc
      }, { headers: {}, body: undefined })
    ).toPromise().then(({ headers, body }) => ({
      headers,
      body: body ? body.join('\n') : undefined
    }))
  }
}

const METHODS = [
  { name: 'CliGet', method: 'GET', description: 'Make a GET request', isUpdate: false },
  { name: 'CliPost', method: 'POST', description: 'Make a POST request', isUpdate: true },
  { name: 'CliPut', method: 'PUT', description: 'Make a PUT request', isUpdate: true },
  { name: 'CliDelete', method: 'DELETE', description: 'Make a DELETE request', isUpdate: false },
  { name: 'CliPatch', method: 'PATCH', description: 'Make a PATCH request', isUpdate: true },
  { name: 'CliHead', method: 'HEAD', description: 'Make a HEAD request', isUpdate: false }
]

const generatedClasses = {}

for (const { name, method, description, isUpdate } of METHODS) {
  generatedClasses[name] = class extends CliHttp {
    static metadata = Object.freeze({
      description
    })

    constructor(...args) {
      super({ method, isUpdate, ...args }, )
    }
  }
}

export const { CliGet, CliPost, CliPut, CliDelete, CliPatch, CliHead } = generatedClasses
