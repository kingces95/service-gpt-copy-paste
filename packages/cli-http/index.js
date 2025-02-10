#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import axios from 'axios'
import { fromReadline } from '@kingjs/rx-from-readline'
import readline from 'readline/promises'
import { reduce } from 'rxjs/operators'

const HTTP_UPDATE_METHODS = ['POST', 'PUT', 'PATCH']

export class CliHttp extends Cli {
  static description = 'Send a HTTP request'
  static parameter = {
    url: 'The url to request',
    headers: 'The number of lines to read as the HTTP header',
    method: 'The HTTP method to use',
  }
  static choices = {
    method: [ 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD' ]
  }
  static local = {
    method: true
  }
  static commands = {
    post: '@kingjs/cli-http CliHttpPost',
    get: '@kingjs/cli-http CliHttpGet',
    put: '@kingjs/cli-http CliHttpPut',
    delete: '@kingjs/cli-http CliHttpDelete',
    patch: '@kingjs/cli-http CliHttpPatch',
    head: '@kingjs/cli-http CliHttpHead',
  }
  static meta = CliHttp.load()

  constructor(url, headers = 0, { method = 'GET', ...rest } = { }) {
    if (new.target.super(arguments, url, headers, { method }))
      return super(Cli.loading)

    super(rest)

    const isUpdate = HTTP_UPDATE_METHODS.includes(method)

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

const exports = Object.fromEntries(
  Object.entries({
    CliHttpGet: { method: 'GET', description: 'Perform an http GET request' },
    CliHttpPost: { method: 'POST', description: 'Perform an http POST request' },
    CliHttpPut: { method: 'PUT', description: 'Perform an http PUT request' },
    CliHttpDelete: { method: 'DELETE', description: 'Perform an http DELETE request' },
    CliHttpPatch: { method: 'PATCH', description: 'Perform an http PATCH request' },
    CliHttpHead: { method: 'HEAD', description: 'Perform an http HEAD request' }
  }).map(([name, { method, description }]) => [
    name,
    CliHttp.extend({
      name,
      description,
      ctor: function (url, headers = 0, options = {}) {
        return !this ? [url, headers, {}] : [url, headers, { method, ...options }]
      }
    })
  ])
)

export const { 
  CliHttpGet,
  CliHttpPost,
  CliHttpPut,
  CliHttpDelete,
  CliHttpPatch,
  CliHttpHead,
} = exports

CliHttp.__dumpLoader()
