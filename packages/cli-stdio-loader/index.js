import { Stream } from 'stream'

export class CliStdioRuntimeInfo {
  #stream
  #info
  #isOwned
  #isDelegated
  #__redirect

  constructor({ info, stream, isOwned }, __redirect) {
    this.#stream = stream
    this.#info = info
    this.#isOwned = isOwned
    this.#isDelegated = !stream
    this.#__redirect = __redirect
  }

  get loader() { return this.#info.loader }
  get info() { return this.#info }
  get name() { return this.#info.name }
  get slot() { return this.#info.slot }
  get isInput() { return this.#info.isInput }
  get isOutput() { return this.#info.isOutput }
  
  get isOwned() { return this.#isOwned }
  get isDelegated() { return this.#isDelegated }
  get stream() { return this.#stream }
}

export class CliStdioInfo {
  #loader
  #slot
  #name
  #isInput
  #isOutput

  constructor({ loader, slot, name, isInput, isOutput }) {
    this.#loader = loader
    this.#slot = slot
    this.#name = name
    this.#isInput = isInput
    this.#isOutput = isOutput
  }

  get loader() { return this.#loader }
  get slot() { return this.#slot }
  get name() { return this.#name }
  get isInput() { return this.#isInput }
  get isOutput() { return this.#isOutput }

  async load(streamOrPromise, __redirect) {
    const info = this
    const isFunction = typeof streamOrPromise === 'function'
    const stream = await (isFunction ? streamOrPromise() : streamOrPromise)
    const isOwned = streamOrPromise != stream
    return new CliStdioRuntimeInfo({ info, stream, isOwned }, __redirect)
  }
}

export class CliStdioLoader {
  #byName
  #bySlot
  #slots
  #byFd

  constructor(metadata = { 
    slots: [
      { name: 'stdin', isInput: true },
      { name: 'stdout', isOutput: true },
      { name: 'stderr', isOutput: true },
    ],
    streams: [
      process.stdin,
      process.stdout,
      process.stderr,
    ],
  }) {
    this.#byName = new Map()
    this.#bySlot = new Map()
    this.#slots = []

    // load metadata; include index as field slot
    for (let slot = 0; slot < metadata.slots.length; slot++) {
      const entry = metadata.slots[slot]
      const loader = this
      const { name, isInput, isOutput } = entry
      const info = new CliStdioInfo({ loader, slot, name, isInput, isOutput })
      this.#byName.set(name, info)
      this.#bySlot.set(slot, info)
      this.#slots[slot] = info
    }

    this.#byFd = new Map()
    for (const stream of metadata.streams)
      this.#byFd.set(stream.fd, stream)
  }

  getStream(fdOrStream) { 
    if (fdOrStream instanceof Stream) return fdOrStream
    return this.#byFd.get(fdOrStream) 
  }
  getInfo(nameOrSlot) {
    // override; convert string slot to number slot
    if (typeof nameOrSlot === 'string') {
      const slot = Number(nameOrSlot)
      if (!isNaN(slot)) return this.getInfo(slot)
    }

    switch (typeof nameOrSlot) {
      case 'number': return this.#bySlot.get(nameOrSlot) ?? null
      case 'string': return this.#byName.get(nameOrSlot) ?? null
      default: return null
    }
  }
  getSlot(nameOrSlot) { return this.getInfo(nameOrSlot)?.slot ?? null }
  getName(nameOrSlot) { return this.getInfo(nameOrSlot)?.name ?? null }
  isKnown(streamSlotOrName) { return this.getInfo(streamSlotOrName) != null }

  async load(stdio = [], __stdio = []) {
    const slots = this.#slots
    const runtimeInfos = new Array(slots.length)
    for (let slot = 0; slot < slots.length; slot++) {
      const info = slots[slot]
      const __redirect = __stdio[slot]
      const streamOrFd = stdio[slot] ?? null
      const stream = this.#byFd.get(streamOrFd) ?? streamOrFd
      runtimeInfos[slot] = await info.load(stream, __redirect)
    }
    return runtimeInfos
  }

  // allow enumeration of all streams
  *[Symbol.iterator]() {
    for (const stream of this.#slots) {
      if (stream) yield stream
    }
  }
}
