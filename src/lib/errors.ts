export class IrisError extends Error {
  constructor(
    readonly code: 1 | 2,
    message: string,
  ) {
    super(message);
    this.name = 'IrisError';
  }
}
