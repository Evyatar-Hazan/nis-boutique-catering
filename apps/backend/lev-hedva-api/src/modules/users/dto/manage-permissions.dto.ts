import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission names to assign',
    example: ['users.read', 'users.write', 'products.read'],
    type: [String],
  })
  @IsArray({ message: 'Permissions must be an array' })
  @ArrayNotEmpty({ message: 'At least one permission must be specified' })
  @IsString({ each: true, message: 'Each permission must be a string' })
  permissions: string[];
}

export class RevokePermissionsDto {
  @ApiProperty({
    description: 'Array of permission names to revoke',
    example: ['users.write', 'users.delete'],
    type: [String],
  })
  @IsArray({ message: 'Permissions must be an array' })
  @ArrayNotEmpty({ message: 'At least one permission must be specified' })
  @IsString({ each: true, message: 'Each permission must be a string' })
  permissions: string[];
}
