import { NextRequest } from 'next/server';

// Fixed admin user ID for database operations
export const ADMIN_USER_ID = 'admin-user-id';

/**
 * Get user ID from request, checking both NextAuth session and admin token
 */
export function getUserIdFromRequest(userId: string | undefined, req: NextRequest): string | undefined {
  // If already have a user ID from NextAuth, use it
  if (userId) {
    return userId;
  }

  // Check for admin session
  try {
    const adminToken = req.cookies.get('admin-session')?.value;
    if (adminToken) {
      return ADMIN_USER_ID;
    }
  } catch (error) {
    console.error('Error checking admin token:', error);
  }

  return undefined;
}

/**
 * Check if request is from admin user
 */
export function isAdminRequest(req: NextRequest): boolean {
  try {
    const adminToken = req.cookies.get('admin-session')?.value;
    return !!adminToken;
  } catch (error) {
    console.error('Error checking admin token:', error);
    return false;
  }
}
