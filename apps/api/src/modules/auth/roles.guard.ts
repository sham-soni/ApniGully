import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => (target: any, key?: string, descriptor?: any) => {
  Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
  return descriptor ?? target;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.memberships) {
      throw new ForbiddenException('Access denied');
    }

    // Get neighborhood ID from request (params or body)
    const neighborhoodId = request.params.neighborhoodId || request.body.neighborhoodId;

    if (neighborhoodId) {
      // Check role for specific neighborhood
      const membership = user.memberships.find(
        (m: any) => m.neighborhoodId === neighborhoodId && m.isActive,
      );

      if (!membership) {
        throw new ForbiddenException('Not a member of this neighborhood');
      }

      if (!requiredRoles.includes(membership.role)) {
        throw new ForbiddenException('Insufficient permissions');
      }
    } else {
      // Check if user has any of the required roles in any neighborhood
      const hasRole = user.memberships.some(
        (m: any) => m.isActive && requiredRoles.includes(m.role),
      );

      if (!hasRole) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}

// Permission matrix helper
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  resident: 1,
  helper: 2,
  shop_owner: 2,
  verified_resident: 3,
  moderator: 4,
  admin: 5,
};

export function hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Common role combinations
export const MODERATION_ROLES: UserRole[] = ['moderator', 'admin'];
export const VERIFIED_ROLES: UserRole[] = ['verified_resident', 'moderator', 'admin'];
export const ALL_MEMBER_ROLES: UserRole[] = ['resident', 'verified_resident', 'helper', 'shop_owner', 'moderator', 'admin'];
