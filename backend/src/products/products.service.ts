import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../database/entities/product.entity';
import { ProductCategory } from '../database/entities/product-category.entity';
import { PriceHistory } from '../database/entities/price-history.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdatePriceDto } from './dto/update-price.dto';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepository: Repository<PriceHistory>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { categoryId, linkedShotProductId, ...productData } =
      createProductDto;

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify linked shot product exists if provided
    if (linkedShotProductId) {
      const linkedProduct = await this.productRepository.findOne({
        where: { id: linkedShotProductId },
      });

      if (!linkedProduct) {
        throw new NotFoundException('Linked shot product not found');
      }
    }

    // Check for duplicate product name in same category
    const existingProduct = await this.productRepository.findOne({
      where: {
        name: ILike(productData.name),
        categoryId,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        'A product with this name already exists in this category',
      );
    }

    const product = this.productRepository.create({
      ...productData,
      categoryId,
      linkedShotProductId,
      currentStock: productData.currentStock || 0,
    });

    return this.productRepository.save(product);
  }

  async findAll(queryDto: QueryProductsDto): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { categoryId, search, isActive, page = 1, limit = 50 } = queryDto;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('product.name', 'ASC');

    // Filter by category
    if (categoryId) {
      queryBuilder.where('product.categoryId = :categoryId', { categoryId });
    }

    // Filter by active status
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }

    // Search by name
    if (search) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      products,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'priceHistory'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.productRepository.find({
      where: { categoryId, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If category is being changed, verify it exists
    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // If linked shot product is being changed, verify it exists
    if (updateProductDto.linkedShotProductId) {
      const linkedProduct = await this.productRepository.findOne({
        where: { id: updateProductDto.linkedShotProductId },
      });

      if (!linkedProduct) {
        throw new NotFoundException('Linked shot product not found');
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  async updatePrice(
    id: string,
    updatePriceDto: UpdatePriceDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const { newPrice, reason } = updatePriceDto;

    // Create price history record
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Start of next day

    const priceHistory = this.priceHistoryRepository.create({
      productId: id,
      userId,
      oldPrice: product.currentPrice,
      newPrice,
      effectiveDate: tomorrow,
      reason,
    });

    await this.priceHistoryRepository.save(priceHistory);

    // Update product price (will take effect in daily sales calculations)
    product.currentPrice = newPrice;
    return this.productRepository.save(product);
  }

  async getPriceHistory(id: string): Promise<PriceHistory[]> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.priceHistoryRepository.find({
      where: { productId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Soft delete - just mark as inactive
    product.isActive = false;
    await this.productRepository.save(product);

    return { message: 'Product deactivated successfully' };
  }

  async getProductStats(): Promise<any> {
    const totalProducts = await this.productRepository.count();
    const activeProducts = await this.productRepository.count({
      where: { isActive: true },
    });

    const totalValue = await this.productRepository
      .createQueryBuilder('product')
      .select('SUM(product.currentStock * product.currentPrice)', 'total')
      .where('product.isActive = :isActive', { isActive: true })
      .getRawOne();

    const lowStockProducts = await this.productRepository
      .createQueryBuilder('product')
      .where('product.currentStock < :threshold', { threshold: 10 })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getCount();

    return {
      total: totalProducts,
      active: activeProducts,
      inactive: totalProducts - activeProducts,
      totalInventoryValue: parseFloat(totalValue?.total || '0'),
      lowStock: lowStockProducts,
    };
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    return this.productRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { currentStock: 'ASC' },
      take: 20,
    });
  }
}
