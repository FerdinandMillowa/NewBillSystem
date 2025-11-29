import api from './api';
import type {
  Product,
  CreateProductDto,
  UpdateProductDto,
  UpdatePriceDto,
  PriceHistory,
  ProductStats,
} from '../types/product.types';

export const productsService = {
  // Get all products
  async getAll(params?: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { data } = await api.get('/products', { params });
    return data;
  },

  // Get single product
  async getById(id: string): Promise<Product> {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  // Get products by category
  async getByCategory(categoryId: string): Promise<Product[]> {
    const { data } = await api.get(`/products/category/${categoryId}`);
    return data;
  },

  // Create product
  async create(productData: CreateProductDto): Promise<Product> {
    const { data } = await api.post('/products', productData);
    return data;
  },

  // Update product
  async update(id: string, productData: UpdateProductDto): Promise<Product> {
    const { data } = await api.patch(`/products/${id}`, productData);
    return data;
  },

  // Update price
  async updatePrice(id: string, priceData: UpdatePriceDto): Promise<Product> {
    const { data } = await api.patch(`/products/${id}/price`, priceData);
    return data;
  },

  // Get price history
  async getPriceHistory(id: string): Promise<PriceHistory[]> {
    const { data } = await api.get(`/products/${id}/price-history`);
    return data;
  },

  // Delete product (soft delete)
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  // Get product stats
  async getStats(): Promise<ProductStats> {
    const { data } = await api.get('/products/stats');
    return data;
  },

  // Get low stock products
  async getLowStock(threshold?: number): Promise<Product[]> {
    const { data } = await api.get('/products/low-stock', {
      params: { threshold },
    });
    return data;
  },
};