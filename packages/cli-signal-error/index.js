// Base error for signal-related terminations
export class CliSignalError extends Error {
  constructor(signal) {
    super(`Process terminated with signal: ${signal}`)
    this.name = this.constructor.name
    this.signal = signal
  }

  static ExitCode = 128
  static registry = new Map()

  static register(signal, ctor) {
    this.registry.set(signal, ctor)
  }

  static from(signal) {
    const ErrorClass = this.registry.get(signal) || CliSignalError
    return new ErrorClass(signal)
  }
}

// --- Termination Signals ---

export class CliTerminationSignalError extends CliSignalError {}

export class CliInterruptSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 2
  static Name = 'SIGINT'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliTerminateSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 15
  static Name = 'SIGTERM'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliKillSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 9
  static Name = 'SIGKILL'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliHangupSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 1
  static Name = 'SIGHUP'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliQuitSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 3
  static Name = 'SIGQUIT'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliAbortSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 6
  static Name = 'SIGABRT'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliAlarmSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 14
  static Name = 'SIGALRM'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliPipeSignalError extends CliTerminationSignalError {
  static ExitCode = CliSignalError.ExitCode + 13
  static Name = 'SIGPIPE'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

// --- User-defined Signals ---

export class CliUserSignalError extends CliSignalError {}

export class CliUserDefined1SignalError extends CliUserSignalError {
  static ExitCode = CliSignalError.ExitCode + 10
  static Name = 'SIGUSR1'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliUserDefined2SignalError extends CliUserSignalError {
  static ExitCode = CliSignalError.ExitCode + 12
  static Name = 'SIGUSR2'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

// --- Job Control Signals ---

export class CliJobControlSignalError extends CliSignalError {}

export class CliStopSignalError extends CliJobControlSignalError {
  static ExitCode = CliSignalError.ExitCode + 19
  static Name = 'SIGSTOP'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliTerminalStopSignalError extends CliJobControlSignalError {
  static ExitCode = CliSignalError.ExitCode + 20
  static Name = 'SIGTSTP'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliContinueSignalError extends CliJobControlSignalError {
  static ExitCode = CliSignalError.ExitCode + 18
  static Name = 'SIGCONT'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

// --- Fault Signals ---

export class CliFaultSignalError extends CliSignalError {}

export class CliIllegalInstructionSignalError extends CliFaultSignalError {
  static ExitCode = CliSignalError.ExitCode + 4
  static Name = 'SIGILL'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliFloatingPointExceptionSignalError extends CliFaultSignalError {
  static ExitCode = CliSignalError.ExitCode + 8
  static Name = 'SIGFPE'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliSegmentationFaultSignalError extends CliFaultSignalError {
  static ExitCode = CliSignalError.ExitCode + 11
  static Name = 'SIGSEGV'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliBusErrorSignalError extends CliFaultSignalError {
  static ExitCode = CliSignalError.ExitCode + 7
  static Name = 'SIGBUS'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

// --- Debugging/Tracing Signals ---

export class CliDebugSignalError extends CliSignalError {}

export class CliTrapSignalError extends CliDebugSignalError {
  static ExitCode = CliSignalError.ExitCode + 5
  static Name = 'SIGTRAP'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

// --- Resource/Timer Signals ---

export class CliResourceSignalError extends CliSignalError {}

export class CliCpuLimitExceededSignalError extends CliResourceSignalError {
  static ExitCode = CliSignalError.ExitCode + 24
  static Name = 'SIGXCPU'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliFileSizeLimitExceededSignalError extends CliResourceSignalError {
  static ExitCode = CliSignalError.ExitCode + 25
  static Name = 'SIGXFSZ'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliVirtualTimerExpiredSignalError extends CliResourceSignalError {
  static ExitCode = CliSignalError.ExitCode + 26
  static Name = 'SIGVTALRM'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliProfilingTimerExpiredSignalError extends CliResourceSignalError {
  static ExitCode = CliSignalError.ExitCode + 27
  static Name = 'SIGPROF'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

// --- Terminal/IO Signals ---

export class CliTerminalIoSignalError extends CliSignalError {}

export class CliWindowChangeSignalError extends CliTerminalIoSignalError {
  static ExitCode = CliSignalError.ExitCode + 28
  static Name = 'SIGWINCH'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliTtyInputSignalError extends CliTerminalIoSignalError {
  static ExitCode = CliSignalError.ExitCode + 21
  static Name = 'SIGTTIN'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliTtyOutputSignalError extends CliTerminalIoSignalError {
  static ExitCode = CliSignalError.ExitCode + 22
  static Name = 'SIGTTOU'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}

export class CliUrgentIoSignalError extends CliTerminalIoSignalError {
  static ExitCode = CliSignalError.ExitCode + 23
  static Name = 'SIGURG'
  constructor() { super(this.constructor.Name) }
  static { CliSignalError.register(this.Name, this) }
}
