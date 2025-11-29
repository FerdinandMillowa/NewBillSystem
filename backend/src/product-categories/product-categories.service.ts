import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ProductCategory } from '../database/entities/product-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoryRepository: Repository<ProductCategory>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<ProductCategory> {
    // Check for duplicate name
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: ILike(createCategoryDto.name) },
    });

    if (existingCategory) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<ProductCategory[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
      relations: ['products'],
    });
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for duplicate name if name is being changed
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: ILike(updateCategoryDto.name) },
      });

      if (existingCategory) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.products && category.products.length > 0) {
      throw new ConflictException(
        'Cannot delete category with existing products. Delete products first or deactivate category.',
      );
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category deleted successfully' };
  }
}
