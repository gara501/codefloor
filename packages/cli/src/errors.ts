/** Error with a CLI exit code: 1 validation/stale failure, 2 usage/IO error. */
export class CliError extends Error {
  constructor(
    message: string,
    readonly exitCode: 1 | 2 = 2,
  ) {
    super(message);
  }
}
