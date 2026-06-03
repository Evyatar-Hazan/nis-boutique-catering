import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('משתמש לא מזוהה');
    }

    // Get user permissions from database
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId: user.userId },
      include: { permission: true },
    });

    const userPermissionNames = userPermissions.map(up => up.permission.name);

    // Check if user has admin permission (bypass all checks)
    if (userPermissionNames.includes('system.admin')) {
      return true;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission =>
      userPermissionNames.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissionNames.includes(permission),
      );
      throw new ForbiddenException(
        `חסרות הרשאות: ${missingPermissions.join(', ')}`
      );
    }

    return true;
  }
}