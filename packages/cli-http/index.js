#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import axios from 'axios'
import { fromReadline } from '@kingjs/rx-from-readline'
import readline from 'readline/promises'
import { reduce } from 'rxjs/operators'

const updateHttpMethods = ['POST', 'PUT', 'PATCH']

class CliHttp extends Cli {
  static description = 'Send a HTTP request'
  static descriptions = {
    url: 'The url to request',
    headers: 'The number of lines to read as the HTTP header',
    method: 'The HTTP method to use',
  }
  static choices = {
    method: [ 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD' ]
  }
  static commands = [
    '@kingjs/cli-http CliHttpPost',
    '@kingjs/cli-http CliHttpGet',
    '@kingjs/cli-http CliHttpPut',
    '@kingjs/cli-http CliHttpDelete',
    '@kingjs/cli-http CliHttpPatch',
    '@kingjs/cli-http CliHttpHead',
  ]
  static info = CliHttp.load()

  constructor(url, headers = 0, { method = 'GET', ...rest } = { }) {
    if (Cli.isLoading(arguments) || CliHttp.saveDefaults(url, headers, { method }))
      return super(Cli.loading)

    super(rest)

    const isUpdate = updateHttpMethods.includes(method)

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
            this.done$()
          } else {
            this.stderr.write(`HTTP request failed with status ${response.status}: ${response.statusText}\n`)
            this.fail$()
          }
        })
      } catch (error) {
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
          this.abort$()
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

const METHODS = {
  CliHttpGet: { method: 'GET', description: 'Make a GET request' },
  CliHttpPost: { method: 'POST', description: 'Make a POST request' },
  CliHttpPut: { method: 'PUT', description: 'Make a PUT request' },
  CliHttpDelete: { method: 'DELETE', description: 'Make a DELETE request' },
  CliHttpPatch: { method: 'PATCH', description: 'Make a PATCH request' },
  CliHttpHead: { method: 'HEAD', description: 'Make a HEAD request'  }
}

const generatedClasses = {}

for (const [name, { method, description }] of Object.entries(METHODS))  {
  const httpMethodCls = class extends CliHttp {
  static description = description

    constructor(...args) {
      if (Cli.isLoading(arguments) || generatedClasses[name].saveDefaults({ }))
        return super(Cli.loading)
  
      super(...args, { method })
    }
  }
  Object.defineProperty(httpMethodCls, "name", { value: name });
  generatedClasses[name] = httpMethodCls
  
  httpMethodCls.info = httpMethodCls.load()
}

export { CliHttp }
export const { 
  CliHttpGet, 
  CliHttpPost, 
  CliHttpPut, 
  CliHttpDelete, 
  CliHttpPatch, 
  CliHttpHead 
} = generatedClasses

CliHttp.__dumpLoader()
