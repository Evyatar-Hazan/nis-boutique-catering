import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { VolunteersService } from './volunteers.service';
import {
  CreateVolunteerActivityDto,
  UpdateVolunteerActivityDto,
  VolunteerActivityResponseDto,
  VolunteerActivitiesQueryDto,
  VolunteerStatsResponseDto,
  VolunteerReportQueryDto,
  VolunteerReportResponseDto,
} from './dto';

@ApiTags('volunteers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post('activities')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_CREATE)
  @ApiOperation({
    summary: 'Create volunteer activity',
    description: 'Create a new volunteer activity record',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Volunteer activity created successfully',
    type: VolunteerActivityResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async createActivity(
    @Body() createActivityDto: CreateVolunteerActivityDto,
    @GetUser() user: any
  ): Promise<VolunteerActivityResponseDto> {
    return this.volunteersService.createActivity(createActivityDto, user);
  }

  @Get('activities')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_READ)
  @ApiOperation({
    summary: 'Get volunteer activities',
    description:
      'Retrieve volunteer activities with optional filtering and pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in description and activity type',
  })
  @ApiQuery({
    name: 'volunteerId',
    required: false,
    type: String,
    description: 'Filter by volunteer ID',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    type: String,
    description: 'Filter by activity type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter to date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['date', 'hours', 'activityType'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Volunteer activities retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async findAllActivities(
    @Query() query: VolunteerActivitiesQueryDto,
    @GetUser() user: any
  ) {
    return this.volunteersService.findAllActivities(query, user);
  }

  @Get('activities/:id')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_READ)
  @ApiOperation({
    summary: 'Get volunteer activity by ID',
    description: 'Retrieve a specific volunteer activity by its ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Volunteer activity ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Volunteer activity retrieved successfully',
    type: VolunteerActivityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Volunteer activity not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async findActivity(
    @Param('id') id: string,
    @GetUser() user: any
  ): Promise<VolunteerActivityResponseDto> {
    return this.volunteersService.findActivityById(id, user);
  }

  @Put('activities/:id')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_UPDATE)
  @ApiOperation({
    summary: 'Update volunteer activity',
    description: 'Update a volunteer activity by its ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Volunteer activity ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Volunteer activity updated successfully',
    type: VolunteerActivityResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or validation errors',
  })
  @ApiNotFoundResponse({
    description: 'Volunteer activity not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async updateActivity(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateVolunteerActivityDto
  ): Promise<VolunteerActivityResponseDto> {
    return this.volunteersService.updateActivity(id, updateActivityDto);
  }

  @Delete('activities/:id')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete volunteer activity',
    description: 'Delete a volunteer activity by its ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Volunteer activity ID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Volunteer activity deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Volunteer activity not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async deleteActivity(@Param('id') id: string): Promise<void> {
    return this.volunteersService.deleteActivity(id);
  }

  @Get('statistics/:volunteerId')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_STATS)
  @ApiOperation({
    summary: 'Get volunteer statistics',
    description: 'Get comprehensive statistics for a specific volunteer',
  })
  @ApiParam({
    name: 'volunteerId',
    type: String,
    format: 'uuid',
    description: 'Volunteer user ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Statistics from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Statistics to date (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Volunteer statistics retrieved successfully',
    type: VolunteerStatsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Volunteer not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async getVolunteerStats(
    @Param('volunteerId') volunteerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<VolunteerStatsResponseDto> {
    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        throw new BadRequestException(
          'Invalid start date format. Use YYYY-MM-DD.'
        );
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        throw new BadRequestException(
          'Invalid end date format. Use YYYY-MM-DD.'
        );
      }
    }

    return this.volunteersService.getVolunteerStats(
      volunteerId,
      parsedStartDate,
      parsedEndDate
    );
  }

  @Get('reports')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_REPORTS)
  @ApiOperation({
    summary: 'Generate volunteer reports',
    description: 'Generate comprehensive reports for volunteer activities',
  })
  @ApiQuery({
    name: 'type',
    required: true,
    enum: ['summary', 'detailed', 'byActivity', 'monthly'],
    description: 'Report type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Report from date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Report to date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'volunteerId',
    required: false,
    type: String,
    description: 'Filter by volunteer ID',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    type: String,
    description: 'Filter by activity type',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generated successfully',
    type: VolunteerReportResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async generateReports(
    @Query() query: VolunteerReportQueryDto
  ): Promise<VolunteerReportResponseDto> {
    return this.volunteersService.generateReports(query);
  }

  @Get('activity-types')
  @RequirePermissions(PERMISSIONS.VOLUNTEER_READ)
  @ApiOperation({
    summary: 'Get activity types',
    description: 'Get a list of all available volunteer activity types',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity types retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['אירוע', 'הכשרה', 'עזרה טכנית', 'ליווי', 'אחר'],
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  @ApiForbiddenResponse({
    description: 'Insufficient permissions',
  })
  async getActivityTypes(): Promise<string[]> {
    return this.volunteersService.getActivityTypes();
  }
}
