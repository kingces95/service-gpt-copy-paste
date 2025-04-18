import { CliCommand } from '@kingjs/cli-command'
import { CliStdOut } from '@kingjs/cli-std-stream'
import axios from 'axios'

const HTTP_UPDATE_METHODS = ['POST', 'PUT', 'PATCH']
const HTTP_SAMPLE = 'https://jsonplaceholder.typicode.com/posts/1'
const HTTP_HANG = 'https://httpbin.org/delay/10'
const HTTP_FAIL = 'https://httpstat.us/500'
const HTTP_ECHO = 'https://httpbin.org/anything'

export class CliHttp extends CliCommand {
  static description = 'Send a HTTP request'
  static parameters = {
    url: 'Url to request',
    headers: 'HTTP headers',
    method: 'HTTP method to use',
  }
  static choices = {
    method: [ 'GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD' ]
  }
  static local = {
    method: true
  }
  static aliases = {
    headers: ['H'],
    method: ['m'],
  }
  static commands = () => ({
    get: '@kingjs/cli-http/methods, CliHttpGet',
    post: '@kingjs/cli-http/methods, CliHttpPost',
    put: '@kingjs/cli-http/methods, CliHttpPut',
    delete: '@kingjs/cli-http/methods, CliHttpDelete',
    patch: '@kingjs/cli-http/methods, CliHttpPatch',
    head: '@kingjs/cli-http/methods, CliHttpHead',
  })
  static defaultCommand = true
  static services = { stdout: CliStdOut }
  static { this.initialize(import.meta) }

  #stdout
  #url
  #method
  #headers
  #isUpdate

  constructor(url = null, { 
    headers = [], method = 'GET', ...rest 
  } = { }) {

    if (CliHttp.initializing(new.target, url, { headers, method }))
      return super()
    super(rest)

    const { stdout } = this.getServices(CliHttp)
    this.#stdout = stdout

    if (!url) url = HTTP_ECHO

    switch (url) {
      case 'sample': url = HTTP_SAMPLE; break
      case 'hang': url = HTTP_HANG; break
      case 'fail': url = HTTP_FAIL; break
      case 'echo': url = HTTP_ECHO; break
    }
    this.#url = url
    this.#method = method
    this.#headers = headers
    this.#isUpdate = HTTP_UPDATE_METHODS.includes(method)
  }

  get url() { return this.#url }
  get method() { return this.#method }
  get headers() { return this.#headers }
  get isUpdate() { return this.#isUpdate }
  get stdout() { return this.#stdout }

  async #handleRequest() {
    const { headers, isUpdate } = this

    if (headersCount === 0 || !isUpdate)
      return { }

    return { headers: 'X-Test: Hello', body: '{"Hello": "world"}' }

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
    const { headers, url, method, stdout } = this
    // const { body } = await this.#handleRequest()
    const body = null

    await new Promise(async (resolve, reject) => {
      try {
        const response = await axios({
          url,
          method,
          headers: headers.length ? headers.join('\n') : undefined,
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
  
// CliHttp.__dumpMetadata(import.meta)

