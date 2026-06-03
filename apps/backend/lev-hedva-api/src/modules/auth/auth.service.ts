import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import {
  AuditActionType,
  AuditEntityType,
} from '../audit/dto/create-audit-log.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, phone, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('משתמש עם אימייל זה כבר קיים במערכת');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role: role || UserRole.CLIENT,
          isActive: true,
        },
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Generate tokens
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '7d',
        }
      );

      // Store refresh token
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(refreshToken, 10) },
      });

      // Log successful registration
      await this.auditService.logUserAction(
        AuditActionType.CREATE,
        AuditEntityType.USER,
        `רישום משתמש חדש: ${user.email}`,
        user.id,
        user.id,
        {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          address: user.address,
          role: user.role,
          isActive: user.isActive,
          permissions: user.userPermissions.map((up) => up.permission.name),
          createdAt: user.createdAt.toISOString(),
        },
      };
    } catch (error) {
      // Log failed registration attempt
      await this.auditService.logUserAction(
        AuditActionType.CREATE,
        AuditEntityType.USER,
        `ניסיון רישום כושל: ${registerDto.email}`,
        undefined,
        undefined,
        {
          email: registerDto.email,
          error: error.message,
        }
      );
      throw new InternalServerErrorException('שגיאה ביצירת המשתמש');
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // First check if user exists and is active
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && !existingUser.isActive) {
      // Log failed login for inactive account
      await this.auditService.logSecurityEvent(
        AuditActionType.FAILED_LOGIN,
        `ניסיון התחברות לחשבון לא פעיל: ${email}`,
        existingUser.id,
        undefined,
        undefined,
        {
          email: email,
          reason: 'חשבון לא פעיל',
        }
      );
      throw new UnauthorizedException(
        'החשבון שלך אינו פעיל. אנא פנה למנהל המערכת לשחרור החשבון.'
      );
    }

    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('פרטי התחברות לא נכונים');
    }

    // Generate tokens
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }
    );

    // Store refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 10),
        lastLogin: new Date(),
      },
    });

    // Log successful login
    await this.auditService.logSecurityEvent(
      AuditActionType.LOGIN,
      `התחברות מוצלחת: ${user.email}`,
      user.id,
      undefined,
      undefined,
      {
        email: user.email,
        role: user.role,
      }
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        permissions: user.userPermissions.map((up) => up.permission.name),
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password: _, refreshToken: __, ...result } = user;
      return result;
    }

    // Log failed login attempt
    await this.auditService.logSecurityEvent(
      AuditActionType.FAILED_LOGIN,
      `ניסיון התחברות כושל: ${email}`,
      user?.id,
      undefined,
      undefined,
      {
        email: email,
        reason: !user
          ? 'משתמש לא קיים'
          : !user.isActive
            ? 'חשבון לא פעיל'
            : 'סיסמה שגויה',
      }
    );

    return null;
  }

  async validateUserById(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userPermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (user && user.isActive) {
      const { password: _, refreshToken: __, ...result } = user;
      return result;
    }
    return null;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token לא סופק');
    }

    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
        include: {
          userPermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('משתמש לא נמצא או לא פעיל');
      }

      // Verify stored refresh token
      const isRefreshTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken || ''
      );
      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Refresh token לא תקין');
      }

      // Generate new tokens
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.jwtService.sign(
        { sub: user.id },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: '7d',
        }
      );

      // Update stored refresh token
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isActive: user.isActive,
          permissions: user.userPermissions.map((up) => up.permission.name),
        },
      };
    } catch {
      throw new UnauthorizedException('Refresh token לא תקין');
    }
  }

  async logout(userId: string): Promise<void> {
    // Get user details for audit log
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Log logout event
    await this.auditService.logSecurityEvent(
      AuditActionType.LOGOUT,
      `התנתקות: ${user?.email || 'משתמש לא ידוע'}`,
      userId,
      undefined,
      undefined,
      {
        email: user?.email,
      }
    );
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userPermissions = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    return userPermissions.map((up) => up.permission.name);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('משתמש לא נמצא או לא פעיל');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await this.auditService.logDataChange(
        AuditActionType.UPDATE,
        AuditEntityType.USER,
        userId,
        `ניסיון כושל לשינוי סיסמה: ${user.email}`,
        userId,
        undefined,
        undefined,
        {
          email: user.email,
          reason: 'סיסמה נוכחית שגויה',
        }
      );
      throw new UnauthorizedException('הסיסמה הנוכחית אינה נכונה');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Log successful password change
    await this.auditService.logDataChange(
      AuditActionType.UPDATE,
      AuditEntityType.USER,
      userId,
      `שינוי סיסמה מוצלח: ${user.email}`,
      userId,
      undefined,
      undefined,
      {
        email: user.email,
      }
    );
  }
}
