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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductInstanceDto } from './dto/create-product-instance.dto';
import { UpdateProductInstanceDto } from './dto/update-product-instance.dto';
import {
  ProductsQueryDto,
  ProductInstancesQueryDto,
} from './dto/product-query.dto';
import {
  ProductResponseDto,
  ProductInstanceResponseDto,
  ProductsListResponseDto,
  ProductInstancesListResponseDto,
} from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('מוצרים')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Product endpoints
  @Post()
  @RequirePermissions('product:create')
  @ApiOperation({ summary: 'יצירת מוצר חדש' })
  @ApiResponse({
    status: 201,
    description: 'מוצר נוצר בהצלחה',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'מוצר עם פרטים אלו כבר קיים במערכת',
  })
  async createProduct(
    @Body() createProductDto: CreateProductDto
  ): Promise<ProductResponseDto> {
    return this.productsService.createProduct(createProductDto);
  }

  @Get()
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת רשימת מוצרים עם סינון וחיפוש' })
  @ApiResponse({
    status: 200,
    description: 'רשימת מוצרים',
    type: ProductsListResponseDto,
  })
  async findAllProducts(
    @Query() query: ProductsQueryDto
  ): Promise<ProductsListResponseDto> {
    return this.productsService.findAllProducts(query);
  }

  @Get('categories')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת רשימת קטגוריות מוצרים' })
  @ApiResponse({ status: 200, description: 'רשימת קטגוריות', type: [String] })
  async getProductCategories(): Promise<string[]> {
    return this.productsService.getProductCategories();
  }

  @Get('manufacturers')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת רשימת יצרנים' })
  @ApiResponse({ status: 200, description: 'רשימת יצרנים', type: [String] })
  async getProductManufacturers(): Promise<string[]> {
    return this.productsService.getProductManufacturers();
  }

  // Product Instance endpoints
  @Post('instances')
  @RequirePermissions('product:update')
  @ApiOperation({ summary: 'יצירת פריט מוצר חדש' })
  @ApiResponse({
    status: 201,
    description: 'פריט נוצר בהצלחה',
    type: ProductInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'מוצר לא נמצא' })
  @ApiResponse({ status: 409, description: 'ברקוד כבר קיים במערכת' })
  async createProductInstance(
    @Body() createInstanceDto: CreateProductInstanceDto
  ): Promise<ProductInstanceResponseDto> {
    return this.productsService.createProductInstance(createInstanceDto);
  }

  @Get('instances')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת רשימת פריטי מוצרים עם סינון וחיפוש' })
  @ApiResponse({
    status: 200,
    description: 'רשימת פריטי מוצרים',
    type: ProductInstancesListResponseDto,
  })
  async findAllProductInstances(
    @Query() query: ProductInstancesQueryDto
  ): Promise<ProductInstancesListResponseDto> {
    return this.productsService.findAllProductInstances(query);
  }

  @Get('instances/conditions')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת רשימת מצבי פריטים' })
  @ApiResponse({
    status: 200,
    description: 'רשימת מצבי פריטים',
    type: [String],
  })
  async getInstanceConditions(): Promise<string[]> {
    return this.productsService.getInstanceConditions();
  }

  @Get('instances/locations')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת רשימת מיקומי פריטים' })
  @ApiResponse({
    status: 200,
    description: 'רשימת מיקומי פריטים',
    type: [String],
  })
  async getInstanceLocations(): Promise<string[]> {
    return this.productsService.getInstanceLocations();
  }

  @Get('instances/barcode/:barcode')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'חיפוש פריט לפי ברקוד' })
  @ApiParam({ name: 'barcode', description: 'ברקוד פריט' })
  @ApiResponse({
    status: 200,
    description: 'פרטי פריט',
    type: ProductInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'פריט לא נמצא' })
  async findProductInstanceByBarcode(
    @Param('barcode') barcode: string
  ): Promise<ProductInstanceResponseDto> {
    return this.productsService.findProductInstanceByBarcode(barcode);
  }

  @Get('instances/:id')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת פריט לפי ID' })
  @ApiParam({ name: 'id', description: 'מזהה פריט' })
  @ApiResponse({
    status: 200,
    description: 'פרטי פריט',
    type: ProductInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'פריט לא נמצא' })
  async findProductInstanceById(
    @Param('id') id: string
  ): Promise<ProductInstanceResponseDto> {
    return this.productsService.findProductInstanceById(id);
  }

  @Put('instances/:id')
  @RequirePermissions('product:update')
  @ApiOperation({ summary: 'עדכון פריט מוצר' })
  @ApiParam({ name: 'id', description: 'מזהה פריט' })
  @ApiResponse({
    status: 200,
    description: 'פריט עודכן בהצלחה',
    type: ProductInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'פריט לא נמצא' })
  @ApiResponse({ status: 409, description: 'ברקוד כבר קיים במערכת' })
  async updateProductInstance(
    @Param('id') id: string,
    @Body() updateInstanceDto: UpdateProductInstanceDto
  ): Promise<ProductInstanceResponseDto> {
    return this.productsService.updateProductInstance(id, updateInstanceDto);
  }

  @Delete('instances/:id')
  @RequirePermissions('product:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'מחיקת פריט מוצר' })
  @ApiParam({ name: 'id', description: 'מזהה פריט' })
  @ApiResponse({ status: 204, description: 'פריט נמחק בהצלחה' })
  @ApiResponse({ status: 404, description: 'פריט לא נמצא' })
  @ApiResponse({ status: 400, description: 'לא ניתן למחוק פריט מושאל' })
  async deleteProductInstance(@Param('id') id: string): Promise<void> {
    return this.productsService.deleteProductInstance(id);
  }

  // Product-specific routes moved after more specific 'instances' routes to avoid route parameter collision
  @Get(':id')
  @RequirePermissions('product:read')
  @ApiOperation({ summary: 'קבלת מוצר לפי ID' })
  @ApiParam({ name: 'id', description: 'מזהה מוצר' })
  @ApiResponse({
    status: 200,
    description: 'פרטי מוצר',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'מוצר לא נמצא' })
  async findProductById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findProductById(id);
  }

  @Put(':id')
  @RequirePermissions('product:update')
  @ApiOperation({ summary: 'עדכון מוצר' })
  @ApiParam({ name: 'id', description: 'מזהה מוצר' })
  @ApiResponse({
    status: 200,
    description: 'מוצר עודכן בהצלחה',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'מוצר לא נמצא' })
  @ApiResponse({
    status: 409,
    description: 'מוצר עם פרטים אלו כבר קיים במערכת',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    return this.productsService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @RequirePermissions('product:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'מחיקת מוצר' })
  @ApiParam({ name: 'id', description: 'מזהה מוצר' })
  @ApiResponse({ status: 204, description: 'מוצר נמחק בהצלחה' })
  @ApiResponse({ status: 404, description: 'מוצר לא נמצא' })
  @ApiResponse({
    status: 400,
    description: 'לא ניתן למחוק מוצר עם פריטים מושאלים',
  })
  async deleteProduct(@Param('id') id: string): Promise<void> {
    return this.productsService.deleteProduct(id);
  }
}
