export class RPSError extends Error {
  errorName: string
  constructor (message: string, errorName?: string) {
    super(message)
    if (errorName) {
      this.name = errorName
    }
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RPSError.prototype)
  }
}
