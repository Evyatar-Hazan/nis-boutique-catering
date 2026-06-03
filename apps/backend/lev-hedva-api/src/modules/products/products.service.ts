import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductInstanceDto } from './dto/create-product-instance.dto';
import { UpdateProductInstanceDto } from './dto/update-product-instance.dto';
import { ProductsQueryDto } from './dto/product-query.dto';
import { ProductInstancesQueryDto } from './dto/product-query.dto';
import {
  ProductResponseDto,
  ProductInstanceResponseDto,
  ProductsListResponseDto,
  ProductInstancesListResponseDto,
} from './dto/product-response.dto';
import { Prisma } from '@prisma/client';
import {
  AuditActionType,
  AuditEntityType,
} from '../audit/dto/create-audit-log.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
    userId?: string
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.create({
        data: createProductDto,
        include: {
          _count: {
            select: {
              instances: true,
            },
          },
        },
      });

      // Log product creation
      if (userId) {
        await this.auditService.logUserAction(
          AuditActionType.CREATE,
          AuditEntityType.PRODUCT,
          `יצירת מוצר חדש: ${product.name}`,
          userId,
          product.id,
          {
            name: product.name,
            category: product.category,
            manufacturer: product.manufacturer,
            model: product.model,
          }
        );
      }

      return {
        ...product,
        totalInstances: product._count.instances,
        availableInstances: 0,
        loanedInstances: 0,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('מוצר עם פרטים אלו כבר קיים במערכת');
      }
      throw error;
    }
  }

  async findAllProducts(
    query: ProductsQueryDto
  ): Promise<ProductsListResponseDto> {
    const { search, category, manufacturer, sortBy, order, page, limit } =
      query;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (manufacturer) {
      where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: order,
    };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              instances: true,
            },
          },
          instances: {
            select: {
              isAvailable: true,
              loans: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const productsWithStats = products.map((product) => {
      const totalInstances = product._count.instances;
      const availableInstances = product.instances.filter(
        (instance) => instance.isAvailable
      ).length;
      const loanedInstances = product.instances.filter((instance) =>
        instance.loans.some((loan) => loan.status === 'ACTIVE')
      ).length;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        manufacturer: product.manufacturer,
        model: product.model,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        totalInstances,
        availableInstances,
        loanedInstances,
      };
    });

    return {
      products: productsWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            instances: true,
          },
        },
        instances: {
          include: {
            loans: {
              select: {
                status: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('מוצר לא נמצא');
    }

    const totalInstances = product._count.instances;
    const availableInstances = product.instances.filter(
      (instance) => instance.isAvailable
    ).length;
    const loanedInstances = product.instances.filter((instance) =>
      instance.loans.some((loan) => loan.status === 'ACTIVE')
    ).length;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      manufacturer: product.manufacturer,
      model: product.model,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      totalInstances,
      availableInstances,
      loanedInstances,
    };
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto
  ): Promise<ProductResponseDto> {
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
        include: {
          _count: {
            select: {
              instances: true,
            },
          },
        },
      });

      return {
        ...product,
        totalInstances: product._count.instances,
        availableInstances: 0,
        loanedInstances: 0,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('מוצר לא נמצא');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('מוצר עם פרטים אלו כבר קיים במערכת');
      }
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const productWithInstances = await this.prisma.product.findUnique({
      where: { id },
      include: {
        instances: {
          include: {
            loans: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!productWithInstances) {
      throw new NotFoundException('מוצר לא נמצא');
    }

    // Check if any instances have active loans
    const hasActiveLoans = productWithInstances.instances.some(
      (instance) => instance.loans.length > 0
    );

    if (hasActiveLoans) {
      throw new BadRequestException('לא ניתן למחוק מוצר עם פריטים מושאלים');
    }

    try {
      await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('מוצר לא נמצא');
      }
      throw error;
    }
  }

  // Product Instance methods
  async createProductInstance(
    createInstanceDto: CreateProductInstanceDto
  ): Promise<ProductInstanceResponseDto> {
    // Check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id: createInstanceDto.productId },
    });

    if (!product) {
      throw new NotFoundException('מוצר לא נמצא');
    }

    try {
      const instance = await this.prisma.productInstance.create({
        data: createInstanceDto,
      });

      return {
        id: instance.id,
        productId: instance.productId,
        barcode: instance.barcode,
        serialNumber: instance.serialNumber,
        condition: instance.condition,
        isAvailable: instance.isAvailable,
        location: instance.location,
        notes: instance.notes,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('ברקוד כבר קיים במערכת');
      }
      throw error;
    }
  }

  async findAllProductInstances(
    query: ProductInstancesQueryDto
  ): Promise<ProductInstancesListResponseDto> {
    const {
      productId,
      search,
      condition,
      location,
      isAvailable,
      sortBy,
      order,
      page,
      limit,
    } = query;

    const where: Prisma.ProductInstanceWhereInput = {};

    if (productId) {
      where.productId = productId;
    }

    if (search) {
      where.OR = [
        { barcode: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          product: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (condition) {
      where.condition = { contains: condition, mode: 'insensitive' };
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (isAvailable !== undefined) {
      where.isAvailable = isAvailable;
    }

    const orderBy: Prisma.ProductInstanceOrderByWithRelationInput = {
      [sortBy]: order,
    };

    const skip = (page - 1) * limit;

    const [instances, total] = await Promise.all([
      this.prisma.productInstance.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          product: true,
          loans: {
            where: { status: 'ACTIVE' },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.productInstance.count({ where }),
    ]);

    const instancesWithDetails = instances.map((instance) => ({
      id: instance.id,
      productId: instance.productId,
      barcode: instance.barcode,
      serialNumber: instance.serialNumber,
      condition: instance.condition,
      isAvailable: instance.isAvailable,
      location: instance.location,
      notes: instance.notes,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      product: instance.product,
      currentLoan:
        instance.loans.length > 0
          ? {
              id: instance.loans[0].id,
              userId: instance.loans[0].userId,
              loanDate: instance.loans[0].loanDate,
              expectedReturnDate: instance.loans[0].expectedReturnDate,
              user: instance.loans[0].user,
            }
          : undefined,
    }));

    return {
      instances: instancesWithDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProductInstanceById(
    id: string
  ): Promise<ProductInstanceResponseDto> {
    const instance = await this.prisma.productInstance.findUnique({
      where: { id },
      include: {
        product: true,
        loans: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('פריט לא נמצא');
    }

    return {
      id: instance.id,
      productId: instance.productId,
      barcode: instance.barcode,
      serialNumber: instance.serialNumber,
      condition: instance.condition,
      isAvailable: instance.isAvailable,
      location: instance.location,
      notes: instance.notes,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      product: instance.product,
      currentLoan:
        instance.loans.length > 0
          ? {
              id: instance.loans[0].id,
              userId: instance.loans[0].userId,
              loanDate: instance.loans[0].loanDate,
              expectedReturnDate: instance.loans[0].expectedReturnDate,
              user: instance.loans[0].user,
            }
          : undefined,
    };
  }

  async findProductInstanceByBarcode(
    barcode: string
  ): Promise<ProductInstanceResponseDto> {
    const instance = await this.prisma.productInstance.findUnique({
      where: { barcode },
      include: {
        product: true,
        loans: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new NotFoundException('פריט לא נמצא');
    }

    return {
      id: instance.id,
      productId: instance.productId,
      barcode: instance.barcode,
      serialNumber: instance.serialNumber,
      condition: instance.condition,
      isAvailable: instance.isAvailable,
      location: instance.location,
      notes: instance.notes,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      product: instance.product,
      currentLoan:
        instance.loans.length > 0
          ? {
              id: instance.loans[0].id,
              userId: instance.loans[0].userId,
              loanDate: instance.loans[0].loanDate,
              expectedReturnDate: instance.loans[0].expectedReturnDate,
              user: instance.loans[0].user,
            }
          : undefined,
    };
  }

  async updateProductInstance(
    id: string,
    updateInstanceDto: UpdateProductInstanceDto
  ): Promise<ProductInstanceResponseDto> {
    try {
      const instance = await this.prisma.productInstance.update({
        where: { id },
        data: updateInstanceDto,
      });

      return {
        id: instance.id,
        productId: instance.productId,
        barcode: instance.barcode,
        serialNumber: instance.serialNumber,
        condition: instance.condition,
        isAvailable: instance.isAvailable,
        location: instance.location,
        notes: instance.notes,
        createdAt: instance.createdAt,
        updatedAt: instance.updatedAt,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('פריט לא נמצא');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('ברקוד כבר קיים במערכת');
      }
      throw error;
    }
  }

  async deleteProductInstance(id: string): Promise<void> {
    const instanceWithLoans = await this.prisma.productInstance.findUnique({
      where: { id },
      include: {
        loans: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    if (!instanceWithLoans) {
      throw new NotFoundException('פריט לא נמצא');
    }

    if (instanceWithLoans.loans.length > 0) {
      throw new BadRequestException('לא ניתן למחוק פריט מושאל');
    }

    try {
      await this.prisma.productInstance.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('פריט לא נמצא');
      }
      throw error;
    }
  }

  async getProductCategories(): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    return products.map((p) => p.category).filter(Boolean);
  }

  async getProductManufacturers(): Promise<string[]> {
    const products = await this.prisma.product.findMany({
      select: { manufacturer: true },
      distinct: ['manufacturer'],
    });

    return products.map((p) => p.manufacturer).filter(Boolean);
  }

  async getInstanceConditions(): Promise<string[]> {
    const instances = await this.prisma.productInstance.findMany({
      select: { condition: true },
      distinct: ['condition'],
    });

    return instances.map((i) => i.condition).filter(Boolean);
  }

  async getInstanceLocations(): Promise<string[]> {
    const instances = await this.prisma.productInstance.findMany({
      select: { location: true },
      distinct: ['location'],
    });

    return instances.map((i) => i.location).filter(Boolean);
  }
}
