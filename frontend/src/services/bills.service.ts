import api from './api';
import type { Bill, CreateBillRequest } from '../types/bill.types';

export const billsService = {
  getAll: async (params?: {
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/bills', { params });
    return data;
  },

  getById: async (id: string): Promise<Bill> => {
    const { data } = await api.get(`/bills/${id}`);
    return data;
  },

  getByCustomer: async (customerId: string): Promise<Bill[]> => {
    const { data } = await api.get(`/bills/customer/${customerId}`);
    return data;
  },

  create: async (bill: CreateBillRequest): Promise<Bill> => {
    const { data } = await api.post('/bills', bill);
    return data;
  },

  update: async (id: string, bill: Partial<CreateBillRequest>): Promise<Bill> => {
    const { data } = await api.patch(`/bills/${id}`, bill);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/bills/${id}`);
  },

  getStats: async () => {
    const { data } = await api.get('/bills/stats');
    return data;
  },

  getRecent: async (limit?: number) => {
    const { data } = await api.get('/bills/recent', { params: { limit } });
    return data;
  },
};