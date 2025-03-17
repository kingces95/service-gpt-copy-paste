#!/usr/bin/env node

import { Cli } from '@kingjs/cli'
import axios from 'axios'
import { fromReadline } from '@kingjs/rx-from-readline'
import readline from 'readline/promises'
import { reduce } from 'rxjs/operators'

const HTTP_UPDATE_METHODS = ['POST', 'PUT', 'PATCH']

export class CliHttp extends Cli {
  static description = 'Send a HTTP request'
  static parameters = {
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
  static commands = () => ({
    get: declareHttpMethod('GET', 'Perform an http GET request'),
    post: declareHttpMethod('POST', 'Perform an http POST request'),
    put: declareHttpMethod('PUT', 'Perform an http PUT request'),
    delete: declareHttpMethod('DELETE', 'Perform an http DELETE request'),
    patch: declareHttpMethod('PATCH', 'Perform an http PATCH request'),
    head: declareHttpMethod('HEAD', 'Perform an http HEAD request'),
  })
  static defaultCommand = true
  static { this.initialize() }

  constructor(url, { headers = 0, method = 'GET', ...rest } = { }) {
    if (CliHttp.initializing(new.target, url, { headers, method }))
      return super()

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

function declareHttpMethod(method, description) {
  const CliHttpMethod = class extends CliHttp {
    static description = description

    constructor(url, headers, options = { }) {
      if (CliHttpMethod.initializing(new.target, options))
        return super()

      super(url, headers, { method, ...options })
    }
  }

  CliHttpMethod.initialize()

  // Set the name of the class to be CliHttp{Method} via property descriptor
  const name = `CliHttp${method.charAt(0)}${method.slice(1).toLowerCase()}`
  Object.defineProperty(CliHttpMethod, 'name', { value: name })
  return CliHttpMethod
}
  
// CliHttp.__dumpMetadata(import.meta)
// CliHttpGet.__dumpMetadata(import.meta)

