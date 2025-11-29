import api from './api';
import type {
  DailySales,
  CreateDailySalesDto,
  UpdateDailySalesDto,
  CreateInventoryTransferDto,
  WeeklySummary,
  MonthlySummary,
} from '../types/daily-sales.types';

export const dailySalesService = {
  // Create daily sales
  async create(data: CreateDailySalesDto): Promise<DailySales> {
    const { data: response } = await api.post('/daily-sales', data);
    return response;
  },

  // Get all daily sales with filters
  async getAll(params?: {
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    sales: DailySales[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { data } = await api.get('/daily-sales', { params });
    return data;
  },

  // Get single daily sales by ID
  async getById(id: string): Promise<DailySales> {
    const { data } = await api.get(`/daily-sales/${id}`);
    return data;
  },

  // Get daily sales by date
  async getByDate(date: string): Promise<DailySales> {
    const { data } = await api.get(`/daily-sales/date/${date}`);
    return data;
  },

  // Get today's sales
  async getToday(): Promise<DailySales | null> {
    const { data } = await api.get('/daily-sales/today');
    return data;
  },

  // Update daily sales
  async update(id: string, data: UpdateDailySalesDto): Promise<DailySales> {
    const { data: response } = await api.patch(`/daily-sales/${id}`, data);
    return response;
  },

  // Finalize daily sales
  async finalize(id: string): Promise<DailySales> {
    const { data } = await api.patch(`/daily-sales/${id}/finalize`);
    return data;
  },

  // Unlock daily sales (admin only)
  async unlock(id: string): Promise<DailySales> {
    const { data } = await api.patch(`/daily-sales/${id}/unlock`);
    return data;
  },

  // Create inventory transfer (bottle to shot)
  async createInventoryTransfer(
    dailySalesId: string,
    data: CreateInventoryTransferDto
  ): Promise<any> {
    const { data: response } = await api.post(
      `/daily-sales/${dailySalesId}/inventory-transfer`,
      data
    );
    return response;
  },

  // Delete daily sales (admin only)
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/daily-sales/${id}`);
    return data;
  },

  // Get weekly summary
  async getWeeklySummary(startDate?: string): Promise<WeeklySummary> {
    const { data } = await api.get('/daily-sales/summary/weekly', {
      params: { startDate },
    });
    return data;
  },

  // Get monthly summary
  async getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
    const { data } = await api.get('/daily-sales/summary/monthly', {
      params: { year, month },
    });
    return data;
  },
};