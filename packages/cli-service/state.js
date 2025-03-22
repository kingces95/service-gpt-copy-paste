import { CliFdWritable } from '@kingjs/cli-fd/writable'
import { CliGroup } from '@kingjs/cli-group'
import { writeRecord } from '@kingjs/cli-echo'

const IFS = ' '
const STDOUT_FD = 1

export class CliServiceState extends CliGroup { 
  static parameters = {
    stdis: 'Provide status updates',
    stdisFd: 'Fd to report status if stdis is set',
  }
  static { this.initialize() }

  #state
  #writable

  constructor({ 
    stdis = false, 
    stdisFd = STDOUT_FD, 
    ...rest 
  } = { }) { 
    if (CliServiceState.initializing(new.target, { stdis, stdisFd })) 
      return super()
    super(rest)

    if (stdis)
      this.#writable = new CliFdWritable({ fd: stdisFd })
  }

  get state() { return this.#state }

  async update(...fields) {
    if (!this.#writable) return
    await writeRecord(this.#writable, this.signal, IFS, [...fields])
  }

  async warnThat(name) {
    this.#state = name
    await this.update('warning', name, this.toString())
  }
  
  async is(name) {
    this.#state = name
    await this.update(name, this.toString())
  }  

  toString() {
    const state = this.state
    return state.charAt(0).toUpperCase() + state.slice(1) + '...'
  }
}
