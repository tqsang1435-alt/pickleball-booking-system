export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    
    // Set the prototype explicitly for extending Error in TypeScript
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
