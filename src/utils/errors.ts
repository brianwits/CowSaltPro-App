export interface ServiceErrorMetadata {
  code?: string;
  details?: Record<string, unknown>;
  source?: string;
}

export class ServiceError extends Error {
  public readonly code: string;
  public readonly metadata: ServiceErrorMetadata;

  constructor(message: string, metadata: ServiceErrorMetadata = {}) {
    super(message);
    this.name = 'ServiceError';
    this.code = metadata.code || 'INTERNAL_ERROR';
    this.metadata = metadata;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ServiceError.prototype);
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      metadata: this.metadata
    };
  }
}

// Common error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
} as const;

// Helper function to create common errors
export const createError = {
  validation: (message: string, details?: Record<string, unknown>) => 
    new ServiceError(message, { code: ErrorCodes.VALIDATION_ERROR, details }),
  notFound: (resource: string) => 
    new ServiceError(`${resource} not found`, { code: ErrorCodes.NOT_FOUND }),
  unauthorized: (message = 'Unauthorized access') => 
    new ServiceError(message, { code: ErrorCodes.UNAUTHORIZED }),
  forbidden: (message = 'Access forbidden') => 
    new ServiceError(message, { code: ErrorCodes.FORBIDDEN }),
  conflict: (message: string) => 
    new ServiceError(message, { code: ErrorCodes.CONFLICT }),
  internal: (message = 'Internal server error') => 
    new ServiceError(message, { code: ErrorCodes.INTERNAL_ERROR }),
  database: (message: string, details?: Record<string, unknown>) => 
    new ServiceError(message, { code: ErrorCodes.DATABASE_ERROR, details }),
  external: (service: string, message: string, details?: Record<string, unknown>) => 
    new ServiceError(message, { 
      code: ErrorCodes.EXTERNAL_SERVICE_ERROR, 
      source: service,
      details 
    })
};

// Type guard for unknown errors
export function isError(error: unknown): error is Error {
  return error instanceof Error;
} 