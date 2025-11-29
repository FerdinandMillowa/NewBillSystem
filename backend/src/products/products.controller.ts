import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // Create product (admin only)
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Get all products (any authenticated user)
  @Get()
  findAll(@Query() queryDto: QueryProductsDto) {
    return this.productsService.findAll(queryDto);
  }

  // Get product stats (any authenticated user)
  @Get('stats')
  getProductStats() {
    return this.productsService.getProductStats();
  }

  // Get low stock products (any authenticated user)
  @Get('low-stock')
  getLowStockProducts(@Query('threshold') threshold?: number) {
    return this.productsService.getLowStockProducts(threshold);
  }

  // Get single product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Get products by category
  @Get('category/:categoryId')
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  // Get price history
  @Get(':id/price-history')
  getPriceHistory(@Param('id') id: string) {
    return this.productsService.getPriceHistory(id);
  }

  // Update product (admin only)
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  // Update price (admin only)
  @Patch(':id/price')
  @Roles(UserRole.ADMIN)
  updatePrice(
    @Param('id') id: string,
    @Body() updatePriceDto: UpdatePriceDto,
    @CurrentUser() user: User,
  ) {
    return this.productsService.updatePrice(id, updatePriceDto, user.id);
  }

  // Delete product (admin only - soft delete)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
