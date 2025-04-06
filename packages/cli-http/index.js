#!/usr/bin/env node

import { CliCommand } from '@kingjs/cli-command'
import { CliStdOut } from '@kingjs/cli-std-stream'
import axios from 'axios'

const HTTP_UPDATE_METHODS = ['POST', 'PUT', 'PATCH']
const HTTP_SAMPLE = 'https://jsonplaceholder.typicode.com/posts/1'
const HTTP_HANG = 'https://httpbin.org/delay/10'
const HTTP_FAIL = 'https://httpstat.us/500'

export class CliHttp extends CliCommand {
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
  static services = { stdout: CliStdOut }
  static { this.initialize(import.meta) }

  #stdout
  #url
  #method
  #headerCount
  #isUpdate

  constructor(url, { headers = 0, method = 'GET', ...rest } = { }) {
    if (CliHttp.initializing(new.target, url, { headers, method }))
      return super()
    super(rest)

    const { stdout } = this.getServices(CliHttp, rest)
    this.#stdout = stdout

    switch (url) {
      case 'sample': url = HTTP_SAMPLE; break
      case 'hang': url = HTTP_HANG; break
      case 'fail': url = HTTP_FAIL; break
    }
    this.#url = url
    this.#method = method
    this.#headerCount = headers
    this.#isUpdate = HTTP_UPDATE_METHODS.includes(method)
  }

  get url() { return this.#url }
  get method() { return this.#method }
  get headersCount() { return this.#headerCount }
  get isUpdate() { return this.#isUpdate }
  get stdout() { return this.#stdout }

  async #handleRequest() {
    const { headers: headersCount, isUpdate } = this

    if (headersCount === 0 || !isUpdate)
      return { }

    throw new Error('Header parsing not implemented yet')
    // const headerRecord = new Record(['key', 'value'])
    // return lines$.pipe(
    //   reduce((acc, line, index) => {
    //     if (index < headersCount) {
    //       // Use Record to parse header lines
    //       const { key, value } = headerRecord.split(line)
    //       acc.headers[key.trim()] = value?.trim() || ''
    //     } else {
    //       // Lazily create the body accumulator array
    //       acc.body = acc.body || []
    //       acc.body.push(line)
    //     }
    //     return acc
    //   }, { headers: {}, body: undefined })
    // ).toPromise().then(({ headers, body }) => ({
    //   headers,
    //   body: body ? body.join('\n') : undefined
    // }))
  }
  
  async execute(signal) {
    const { url, method, stdout } = this
    const { headers, body } = await this.#handleRequest()
    await new Promise(async (resolve, reject) => {
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
  
        response.data.pipe(await stdout)
        response.data.on('error', reject)
        response.data.on('end', () => {
          if (response.status < 200 || response.status >= 300)
            reject(new Error([
              `HTTP ${method} failed with status ${response.status}:`,
              `${response.statusText}\n`].join(' ')))
          else
            resolve()
        })

      } catch (error) {
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') 
          resolve()
        else
          reject(error)
      }
    })
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

  CliHttpMethod.initialize(import.meta)

  // Set the name of the class to be CliHttp{Method} via property descriptor
  const name = `CliHttp${method.charAt(0)}${method.slice(1).toLowerCase()}`
  Object.defineProperty(CliHttpMethod, 'name', { value: name })
  return CliHttpMethod
}
  
// CliHttp.__dumpMetadata(import.meta)
// CliHttpGet.__dumpMetadata(import.meta)

