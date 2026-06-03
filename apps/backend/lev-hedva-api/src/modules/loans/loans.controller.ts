import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiResponse, PaginatedResponse } from '@monorepo/shared-types';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { LoansQueryDto } from './dto/loan-query.dto';
import {
  LoanResponseDto,
  LoansListResponseDto,
  LoanStatsResponseDto,
} from './dto/loan-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('השאלות')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  @RequirePermissions('loan:create')
  @ApiOperation({ summary: 'יצירת השאלה חדשה' })
  @ApiResponse({
    status: 201,
    description: 'השאלה נוצרה בהצלחה',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'משתמש או פריט מוצר לא נמצא' })
  @ApiResponse({ status: 409, description: 'פריט המוצר אינו זמין להשאלה' })
  async createLoan(
    @Body() createLoanDto: CreateLoanDto
  ): Promise<LoanResponseDto> {
    return this.loansService.createLoan(createLoanDto);
  }

  @Get()
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת רשימת השאלות עם סינון וחיפוש' })
  @ApiResponse({
    status: 200,
    description: 'רשימת השאלות',
    type: LoansListResponseDto,
  })
  async findAllLoans(
    @Query() query: LoansQueryDto,
    @GetUser() user: any
  ): Promise<LoansListResponseDto> {
    return this.loansService.findAllLoans(query, user);
  }

  @Get('stats')
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת סטטיסטיקות השאלות' })
  @ApiResponse({
    status: 200,
    description: 'סטטיסטיקות השאלות',
    type: LoanStatsResponseDto,
  })
  async getLoanStats(): Promise<LoanStatsResponseDto> {
    return this.loansService.getLoanStats();
  }

  @Get('overdue')
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת רשימת השאלות באיחור' })
  @ApiResponse({
    status: 200,
    description: 'רשימת השאלות באיחור',
    type: [LoanResponseDto],
  })
  async getOverdueLoans(): Promise<LoanResponseDto[]> {
    return this.loansService.getOverdueLoans();
  }

  @Get('active')
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת רשימת השאלות פעילות' })
  @ApiResponse({
    status: 200,
    description: 'רשימת השאלות פעילות',
    type: [LoanResponseDto],
  })
  async getActiveLoans(): Promise<LoanResponseDto[]> {
    return this.loansService.getActiveLoans();
  }

  @Get('my-loans')
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת ההשאלות הפעילות של המשתמש הנוכחי' })
  @ApiResponse({
    status: 200,
    description: 'השאלות פעילות של המשתמש',
    type: [LoanResponseDto],
  })
  async getMyActiveLoans(
    @GetUser('id') userId: string
  ): Promise<LoanResponseDto[]> {
    return this.loansService.getUserActiveLoans(userId);
  }

  @Get('user/:userId')
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת ההשאלות הפעילות של משתמש ספציפי' })
  @ApiParam({ name: 'userId', description: 'מזהה משתמש' })
  @ApiResponse({
    status: 200,
    description: 'השאלות פעילות של המשתמש',
    type: [LoanResponseDto],
  })
  async getUserActiveLoans(
    @Param('userId') userId: string
  ): Promise<LoanResponseDto[]> {
    return this.loansService.getUserActiveLoans(userId);
  }

  @Get(':id')
  @RequirePermissions('loan:read')
  @ApiOperation({ summary: 'קבלת השאלה לפי ID' })
  @ApiParam({ name: 'id', description: 'מזהה השאלה' })
  @ApiResponse({
    status: 200,
    description: 'פרטי השאלה',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'השאלה לא נמצאה' })
  async findLoanById(
    @Param('id') id: string,
    @GetUser() user: any
  ): Promise<LoanResponseDto> {
    return this.loansService.findLoanById(id, user);
  }

  @Put(':id')
  @RequirePermissions('loan:create')
  @ApiOperation({ summary: 'עדכון השאלה' })
  @ApiParam({ name: 'id', description: 'מזהה השאלה' })
  @ApiResponse({
    status: 200,
    description: 'השאלה עודכנה בהצלחה',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'השאלה לא נמצאה' })
  @ApiResponse({ status: 400, description: 'לא ניתן לעדכן השאלה שאינה פעילה' })
  async updateLoan(
    @Param('id') id: string,
    @Body() updateLoanDto: UpdateLoanDto
  ): Promise<LoanResponseDto> {
    return this.loansService.updateLoan(id, updateLoanDto);
  }

  @Patch(':id/return')
  @RequirePermissions('loan:create')
  @ApiOperation({ summary: 'החזרת השאלה' })
  @ApiParam({ name: 'id', description: 'מזהה השאלה' })
  @ApiResponse({
    status: 200,
    description: 'השאלה הוחזרה בהצלחה',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'השאלה לא נמצאה' })
  @ApiResponse({ status: 400, description: 'השאלה כבר הוחזרה או אינה פעילה' })
  async returnLoanById(
    @Param('id') id: string,
    @Body('notes') notes?: string
  ): Promise<LoanResponseDto> {
    return this.loansService.returnLoanById(id, notes);
  }

  @Patch('return')
  @RequirePermissions('loan:create')
  @ApiOperation({ summary: 'החזרת השאלה' })
  @ApiResponse({
    status: 200,
    description: 'השאלה הוחזרה בהצלחה',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'השאלה לא נמצאה' })
  @ApiResponse({ status: 400, description: 'השאלה כבר הוחזרה או אינה פעילה' })
  async returnLoan(
    @Body() returnLoanDto: ReturnLoanDto
  ): Promise<LoanResponseDto> {
    return this.loansService.returnLoan(returnLoanDto);
  }

  @Patch(':id/mark-lost')
  @RequirePermissions('loan:create')
  @ApiOperation({ summary: 'סימון השאלה כאבודה' })
  @ApiParam({ name: 'id', description: 'מזהה השאלה' })
  @ApiResponse({
    status: 200,
    description: 'השאלה סומנה כאבודה',
    type: LoanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'השאלה לא נמצאה' })
  @ApiResponse({
    status: 400,
    description: 'רק השאלות פעילות יכולות להיות מסומנות כאבודות',
  })
  async markLoanAsLost(
    @Param('id') id: string,
    @Body('notes') notes?: string
  ): Promise<LoanResponseDto> {
    return this.loansService.markLoanAsLost(id, notes);
  }
}
