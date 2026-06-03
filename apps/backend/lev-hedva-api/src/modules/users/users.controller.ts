import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  QueryUsersDto,
  UserResponseDto,
  UsersListResponseDto,
  AssignPermissionsDto,
  RevokePermissionsDto,
} from './dto';
import { JwtAuthGuard, PermissionGuard } from '../auth/guards';
import { RequirePermissions, GetUser } from '../auth/decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @GetUser() currentUser: any
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto, currentUser.userId);
  }

  @Get()
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get all users with pagination and filtering' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: UsersListResponseDto,
  })
  @ApiQuery({ type: QueryUsersDto })
  async findAll(
    @Query() queryDto: QueryUsersDto
  ): Promise<UsersListResponseDto> {
    return this.usersService.findAll(queryDto);
  }

  @Get(':id')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: any
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto, currentUser.userId);
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete yourself',
  })
  async remove(
    @Param('id') id: string,
    @GetUser() currentUser: any
  ): Promise<{ message: string }> {
    return this.usersService.remove(id, currentUser.userId);
  }

  @Patch(':id/deactivate')
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot deactivate yourself',
  })
  async deactivateUser(
    @Param('id') id: string,
    @GetUser() currentUser: any
  ): Promise<UserResponseDto> {
    return this.usersService.deactivateUser(id, currentUser.userId);
  }

  @Patch(':id/activate')
  @RequirePermissions('user:create')
  @ApiOperation({ summary: 'Activate user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User activated successfully',
    type: UserResponseDto,
  })
  async activateUser(
    @Param('id') id: string,
    @GetUser() currentUser: any
  ): Promise<UserResponseDto> {
    return this.usersService.activateUser(id, currentUser.userId);
  }

  @Post(':id/permissions/assign')
  @RequirePermissions('admin:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign permissions to user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User or permissions not found',
  })
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
    @GetUser() currentUser: any
  ): Promise<{ message: string; permissions: string[] }> {
    return this.usersService.assignPermissions(
      id,
      assignPermissionsDto,
      currentUser.userId
    );
  }

  @Post(':id/permissions/revoke')
  @RequirePermissions('admin:users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke permissions from user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Permissions revoked successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async revokePermissions(
    @Param('id') id: string,
    @Body() revokePermissionsDto: RevokePermissionsDto,
    @GetUser() currentUser: any
  ): Promise<{ message: string; permissions: string[] }> {
    return this.usersService.revokePermissions(
      id,
      revokePermissionsDto,
      currentUser.userId
    );
  }

  @Get(':id/permissions')
  @RequirePermissions('user:read')
  @ApiOperation({ summary: 'Get user permissions' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        permissions: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getUserPermissions(
    @Param('id') id: string
  ): Promise<{ permissions: string[] }> {
    const permissions = await this.usersService.getUserPermissions(id);
    return { permissions };
  }
}
