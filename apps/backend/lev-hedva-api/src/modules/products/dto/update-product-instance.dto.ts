import { PartialType } from '@nestjs/swagger';
import { CreateProductInstanceDto } from './create-product-instance.dto';

export class UpdateProductInstanceDto extends PartialType(CreateProductInstanceDto) {}