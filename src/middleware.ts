import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { Role } from '@prisma/client';
import { Permission, hasPermission, getPermissionsForRole } from '@/lib/permissions';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/policies',
  '/claims',
  '/documents',
  '/settings',
];

// Routes with specific role requirements
const ROLE_PROTECTED_ROUTES: Record<string, Role[]> = {
  '/admin': ['ADMIN'],
  '/agent': ['ADMIN', 'AGENT'],
  '/manager': ['ADMIN', 'MANAGER'],
};

// Routes with specific permission requirements
const PERMISSION_PROTECTED_ROUTES: Record<string, Permission[]> = {
  '/policies/create': ['policy:create'],
  '/policies/edit': ['policy:update'],
  '/policies/delete': ['policy:delete'],
  
  '/claims/create': ['claim:create'],
  '/claims/edit': ['claim:update'],
  '/claims/approve': ['claim:approve'],
  '/claims/reject': ['claim:reject'],
  
  '/users': ['user:read'],
  '/users/create': ['user:create'],
  '/users/edit': ['user:update'],
  '/users/delete': ['user:delete'],
  
  '/settings/system': ['system:manage'],
};

// Public routes accessible without authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/api/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if route is a public route
  if (PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`) || pathname.startsWith('/api/auth/')
  )) {
    return NextResponse.next();
  }
  
  // Get user token from session
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET,
  });
  
  // Redirect to login if not authenticated
  if (!token) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check if route requires special permissions
  if (pathname) {
    // Check role-protected routes
    for (const [route, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        const userRole = token.role as Role;
        
        if (!roles.includes(userRole)) {
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }
    
    // Check permission-protected routes
    for (const [route, requiredPermissions] of Object.entries(PERMISSION_PROTECTED_ROUTES)) {
      if (pathname === route || pathname.startsWith(`${route}/`)) {
        const userRole = token.role as Role;
        const userPermissions = getPermissionsForRole(userRole);
        
        // Check if user has all required permissions
        const hasAllRequired = requiredPermissions.every(permission => 
          userPermissions.includes(permission)
        );
        
        if (!hasAllRequired) {
          // Redirect to unauthorized page
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }
    }
  }
  
  // Allow access if all checks pass
  return NextResponse.next();
}

// Configure the middleware to run only for specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 