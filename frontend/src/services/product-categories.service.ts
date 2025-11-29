import api from './api';
import type {
  ProductCategory,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../types/product.types';

export const productCategoriesService = {
  // Get all categories
  async getAll(): Promise<ProductCategory[]> {
    const { data } = await api.get('/product-categories');
    return data;
  },

  // Get single category
  async getById(id: string): Promise<ProductCategory> {
    const { data } = await api.get(`/product-categories/${id}`);
    return data;
  },

  // Create category
  async create(categoryData: CreateCategoryDto): Promise<ProductCategory> {
    const { data } = await api.post('/product-categories', categoryData);
    return data;
  },

  // Update category
  async update(
    id: string,
    categoryData: UpdateCategoryDto,
  ): Promise<ProductCategory> {
    const { data } = await api.patch(`/product-categories/${id}`, categoryData);
    return data;
  },

  // Delete category
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/product-categories/${id}`);
    return data;
  },
};