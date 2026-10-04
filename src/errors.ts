export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly expose = true) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message: string) => new AppError(404, message);
export const badRequest = (message: string) => new AppError(400, message);
