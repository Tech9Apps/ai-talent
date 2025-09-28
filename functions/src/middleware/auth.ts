/**
 * Authentication middleware for Firebase Functions
 * Provides reusable authentication validation following SOLID principles
 */

import { CallableRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

/**
 * Authentication error class for better error handling
 */
export class AuthError extends Error {
  constructor(message: string, public code: string = "UNAUTHENTICATED") {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Interface for authenticated request context
 */
export interface AuthenticatedContext {
  userId: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Middleware function to validate user authentication
 * @param request - Firebase callable request
 * @returns Promise<AuthenticatedContext> - Authenticated user context
 * @throws AuthError - When user is not authenticated
 */
export async function validateAuthentication(
  request: CallableRequest
): Promise<AuthenticatedContext> {
  try {
    // Check if user is authenticated
    if (!request.auth?.uid) {
      logger.warn("Unauthenticated request attempt", {
        structuredData: true,
        timestamp: new Date().toISOString(),
        ip: request.rawRequest.ip,
      });
      
      throw new AuthError(
        "User must be authenticated to access this resource",
        "UNAUTHENTICATED"
      );
    }

    const context: AuthenticatedContext = {
      userId: request.auth.uid,
      email: request.auth.token?.email,
      emailVerified: request.auth.token?.email_verified,
    };

    logger.info("User authenticated successfully", {
      structuredData: true,
      userId: context.userId,
      email: context.email,
      emailVerified: context.emailVerified,
      timestamp: new Date().toISOString(),
    });

    return context;

  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }

    logger.error("Authentication validation error", {
      structuredData: true,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });

    throw new AuthError(
      "Authentication validation failed",
      "AUTH_VALIDATION_ERROR"
    );
  }
}

/**
 * Middleware to validate specific user permissions
 * @param context - Authenticated user context
 * @param requiredPermissions - Array of required permissions
 * @returns Promise<void>
 * @throws AuthError - When user lacks required permissions
 */
export async function validatePermissions(
  context: AuthenticatedContext,
  requiredPermissions: string[] = []
): Promise<void> {
  // For now, we just check if email is verified for sensitive operations
  if (requiredPermissions.includes("email_verified") && !context.emailVerified) {
    throw new AuthError(
      "Email verification required for this operation",
      "EMAIL_NOT_VERIFIED"
    );
  }

  // Future: Add role-based permission validation here
  logger.info("Permissions validated", {
    structuredData: true,
    userId: context.userId,
    permissions: requiredPermissions,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Decorator function for wrapping callable functions with authentication
 * @param handler - Function handler that requires authentication
 * @param requiredPermissions - Optional permissions required
 * @returns Wrapped function with authentication middleware
 */
export function withAuthentication<T extends CallableRequest, R>(
  handler: (request: T, context: AuthenticatedContext) => Promise<R>,
  requiredPermissions: string[] = []
) {
  return async (request: T): Promise<R> => {
    const context = await validateAuthentication(request);
    await validatePermissions(context, requiredPermissions);
    
    return handler(request, context);
  };
}