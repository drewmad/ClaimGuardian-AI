'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { Permission, hasAnyPermission, getPermissionsForRole } from '@/lib/permissions';

interface RoleBasedWrapperProps {
  children: ReactNode;
  allowedRoles?: Role[];
  requiredPermissions?: Permission[];
  anyPermission?: boolean;
  fallback?: ReactNode;
}

/**
 * Wrapper component to conditionally render UI elements based on user roles and permissions
 */
export default function RoleBasedWrapper({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  anyPermission = false,
  fallback = null,
}: RoleBasedWrapperProps) {
  const { data: session, status } = useSession();
  
  // While loading, show nothing
  if (status === 'loading') {
    return null;
  }
  
  // If not authenticated, show fallback
  if (status !== 'authenticated' || !session?.user) {
    return <>{fallback}</>;
  }
  
  const userRole = (session.user as any).role as Role || 'USER';
  
  // If roles are specified and user doesn't have any of the allowed roles, show fallback
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }
  
  // If permissions are specified, check if user has the required permissions
  if (requiredPermissions.length > 0) {
    const userPermissions = getPermissionsForRole(userRole);
    
    // Check permissions based on mode: all (default) or any
    const hasRequiredPermissions = anyPermission
      ? hasAnyPermission(userPermissions, requiredPermissions)
      : requiredPermissions.every(permission => userPermissions.includes(permission));
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }
  
  // User has the required role/permissions, render children
  return <>{children}</>;
}

/**
 * Convenience wrapper for admin-only content
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedWrapper allowedRoles={['ADMIN']} fallback={fallback}>
      {children}
    </RoleBasedWrapper>
  );
}

/**
 * Convenience wrapper for staff-only content (admin, agent, adjuster, manager)
 */
export function StaffOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleBasedWrapper 
      allowedRoles={['ADMIN', 'AGENT', 'ADJUSTER', 'MANAGER']} 
      fallback={fallback}
    >
      {children}
    </RoleBasedWrapper>
  );
} 