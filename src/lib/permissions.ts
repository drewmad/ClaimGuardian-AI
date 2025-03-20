import { Role } from '@prisma/client';

// Define permission types based on resource and action
export type ResourceType = 'policy' | 'claim' | 'document' | 'user' | 'system';
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'reject' | 'manage';
export type Permission = `${ResourceType}:${ActionType}`;

// Permissions for specific roles
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [
    'policy:read',
    'policy:create',
    'claim:read',
    'claim:create',
    'document:read',
    'document:create',
    'document:delete',
  ],
  
  AGENT: [
    'policy:read',
    'policy:create',
    'policy:update',
    'claim:read',
    'claim:create',
    'claim:update',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'user:read',
  ],
  
  ADJUSTER: [
    'policy:read',
    'claim:read',
    'claim:update',
    'claim:approve',
    'claim:reject',
    'document:read',
    'document:create',
    'document:update',
  ],
  
  MANAGER: [
    'policy:read',
    'policy:create',
    'policy:update',
    'policy:delete',
    'claim:read',
    'claim:create',
    'claim:update',
    'claim:delete',
    'claim:approve',
    'claim:reject',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'user:read',
    'user:update',
  ],
  
  ADMIN: [
    'policy:read',
    'policy:create',
    'policy:update',
    'policy:delete',
    'claim:read',
    'claim:create',
    'claim:update',
    'claim:delete',
    'claim:approve',
    'claim:reject',
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'system:manage',
  ],
};

/**
 * Check if a user has permission to perform an action on a resource
 */
export function hasPermission(
  userPermissions: Permission[], 
  resource: ResourceType, 
  action: ActionType
): boolean {
  const requiredPermission = `${resource}:${action}` as Permission;
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userPermissions: Permission[], 
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userPermissions: Permission[], 
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Merge permissions from multiple roles
 */
export function mergePermissions(permissions: Permission[][]): Permission[] {
  return [...new Set(permissions.flat())];
}

/**
 * Check if a user has ownership of a resource
 * This is used in conjunction with permissions for more granular access control
 */
export function isResourceOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Generate a list of human-readable permission descriptions
 */
export function getPermissionDescriptions(permissions: Permission[]): string[] {
  const descriptions: Record<Permission, string> = {
    'policy:read': 'View insurance policies',
    'policy:create': 'Create new insurance policies',
    'policy:update': 'Update insurance policy details',
    'policy:delete': 'Delete insurance policies',
    
    'claim:read': 'View insurance claims',
    'claim:create': 'Submit new insurance claims',
    'claim:update': 'Update claim information',
    'claim:delete': 'Delete insurance claims',
    'claim:approve': 'Approve insurance claims',
    'claim:reject': 'Reject insurance claims',
    
    'document:read': 'View documents',
    'document:create': 'Upload new documents',
    'document:update': 'Update document information',
    'document:delete': 'Delete documents',
    
    'user:read': 'View user information',
    'user:create': 'Create new user accounts',
    'user:update': 'Update user account information',
    'user:delete': 'Delete user accounts',
    
    'system:manage': 'Manage system settings and configuration',
  };
  
  return permissions.map(permission => descriptions[permission] || permission);
} 