import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Prisma } from '@prisma/client';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
  UserResponseDto,
  UsersListResponseDto,
  AssignPermissionsDto,
  RevokePermissionsDto,
} from './dto';
import {
  AuditActionType,
  AuditEntityType,
} from '../audit/dto/create-audit-log.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async create(
    createUserDto: CreateUserDto,
    creatorId: string
  ): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, phone, role, isActive } =
      createUserDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('משתמש עם אימייל זה כבר קיים במערכת');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role,
          isActive: isActive ?? true,
        },
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Log user creation
      await this.auditService.logUserAction(
        AuditActionType.CREATE,
        AuditEntityType.USER,
        `יצירת משתמש חדש: ${user.email}`,
        creatorId,
        user.id,
        {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
        }
      );

      return this.mapToUserResponse(user);
    } catch {
      throw new BadRequestException('שגיאה ביצירת המשתמש');
    }
  }

  async findAll(queryDto: QueryUsersDto): Promise<UsersListResponseDto> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build order by clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      users: users.map((user) => this.mapToUserResponse(user)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    return this.mapToUserResponse(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    updaterId: string
  ): Promise<UserResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    // Check if email is being changed and if it conflicts
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('אימייל זה כבר קיים במערכת');
      }
    }

    const updateData: any = { ...updateUserDto };

    // Hash password if provided
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Log user update
      await this.auditService.logUserAction(
        AuditActionType.UPDATE,
        AuditEntityType.USER,
        `עדכון משתמש: ${updatedUser.email}`,
        updaterId,
        updatedUser.id,
        {
          oldValues: {
            email: existingUser.email,
            role: existingUser.role,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            isActive: existingUser.isActive,
          },
          newValues: {
            email: updatedUser.email,
            role: updatedUser.role,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            isActive: updatedUser.isActive,
          },
          changes: Object.keys(updateUserDto),
        }
      );

      return this.mapToUserResponse(updatedUser);
    } catch {
      throw new BadRequestException('שגיאה בעדכון המשתמש');
    }
  }

  async remove(id: string, deleterId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('משתמש לא נמצא');
    }

    // Prevent deleting yourself
    if (id === deleterId) {
      throw new ForbiddenException('אין אפשרות למחוק את המשתמש שלך');
    }

    try {
      await this.prisma.user.delete({
        where: { id },
      });

      // Log user deletion
      await this.auditService.logUserAction(
        AuditActionType.DELETE,
        AuditEntityType.USER,
        `מחיקת משתמש: ${user.email}`,
        deleterId,
        user.id,
        {
          deletedUser: {
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        }
      );

      return { message: 'המשתמש נמחק בהצלחה' };
    } catch {
      throw new BadRequestException('שגיאה במחיקת המשתמש');
    }
  }

  async deactivateUser(
    id: string,
    deactivatorId: string
  ): Promise<UserResponseDto> {
    const user = await this.findOne(id);

    if (id === deactivatorId) {
      throw new ForbiddenException('אין אפשרות לכבות את המשתמש שלך');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Log user deactivation
    await this.auditService.logUserAction(
      AuditActionType.UPDATE,
      AuditEntityType.USER,
      `השבתת משתמש: ${user.email}`,
      deactivatorId,
      user.id,
      {
        action: 'deactivate',
        email: user.email,
        previousStatus: true,
        newStatus: false,
      }
    );

    return this.mapToUserResponse(updatedUser);
  }

  async activateUser(
    id: string,
    activatorId: string
  ): Promise<UserResponseDto> {
    const user = await this.findOne(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: true },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    // Log user activation
    await this.auditService.logUserAction(
      AuditActionType.UPDATE,
      AuditEntityType.USER,
      `הפעלת משתמש: ${user.email}`,
      activatorId,
      user.id,
      {
        action: 'activate',
        email: user.email,
        previousStatus: false,
        newStatus: true,
      }
    );

    return this.mapToUserResponse(updatedUser);
  }

  async assignPermissions(
    userId: string,
    assignPermissionsDto: AssignPermissionsDto,
    assignerId: string
  ): Promise<{ message: string; permissions: string[] }> {
    const user = await this.findOne(userId);
    const { permissions } = assignPermissionsDto;

    // Get permission IDs
    const permissionRecords = await this.prisma.permission.findMany({
      where: {
        name: { in: permissions },
      },
    });

    const foundPermissionNames = permissionRecords.map((p) => p.name);
    const notFoundPermissions = permissions.filter(
      (p) => !foundPermissionNames.includes(p)
    );

    if (notFoundPermissions.length > 0) {
      throw new BadRequestException(
        `הרשאות לא נמצאו: ${notFoundPermissions.join(', ')}`
      );
    }

    // Assign permissions
    const assignments = [];
    for (const permission of permissionRecords) {
      const existingAssignment = await this.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id,
          },
        },
      });

      if (!existingAssignment) {
        assignments.push({
          userId,
          permissionId: permission.id,
          grantedBy: assignerId,
        });
      }
    }

    if (assignments.length > 0) {
      await this.prisma.userPermission.createMany({
        data: assignments,
        skipDuplicates: true,
      });

      // Log permissions assignment
      await this.auditService.logUserAction(
        AuditActionType.UPDATE,
        AuditEntityType.USER,
        `הקצאת הרשאות למשתמש: ${user.email}`,
        assignerId,
        userId,
        {
          action: 'assign_permissions',
          assignedPermissions: assignments.map(
            (a) => permissionRecords.find((p) => p.id === a.permissionId)?.name
          ),
          permissionCount: assignments.length,
        }
      );
    }

    const newPermissions = assignments
      .map((a) => permissionRecords.find((p) => p.id === a.permissionId)?.name)
      .filter(Boolean);

    return {
      message:
        assignments.length > 0
          ? `${assignments.length} הרשאות נוספו בהצלחה`
          : 'כל ההרשאות כבר קיימות',
      permissions: newPermissions,
    };
  }

  async revokePermissions(
    userId: string,
    revokePermissionsDto: RevokePermissionsDto,
    revokerId: string
  ): Promise<{ message: string; permissions: string[] }> {
    const user = await this.findOne(userId);
    const { permissions } = revokePermissionsDto;

    // Get permission IDs
    const permissionRecords = await this.prisma.permission.findMany({
      where: {
        name: { in: permissions },
      },
    });

    const deletedCount = await this.prisma.userPermission.deleteMany({
      where: {
        userId,
        permissionId: {
          in: permissionRecords.map((p) => p.id),
        },
      },
    });

    if (deletedCount.count > 0) {
      // Log permissions revocation
      await this.auditService.logUserAction(
        AuditActionType.UPDATE,
        AuditEntityType.USER,
        `ביטול הרשאות למשתמש: ${user.email}`,
        revokerId,
        userId,
        {
          action: 'revoke_permissions',
          revokedPermissions: permissionRecords.map((p) => p.name),
          permissionCount: deletedCount.count,
        }
      );
    }

    return {
      message:
        deletedCount.count > 0
          ? `${deletedCount.count} הרשאות הוסרו בהצלחה`
          : 'לא נמצאו הרשאות להסרה',
      permissions: permissionRecords.map((p) => p.name),
    };
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    return userPermissions.map((up) => up.permission.name);
  }

  private mapToUserResponse(user: any): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      permissions: user.userPermissions?.map((up) => up.permission.name) || [],
    };
  }
}
