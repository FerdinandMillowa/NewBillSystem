import api from './api';
import type { Customer, CreateCustomerRequest } from '../types/customer.types';

export const customersService = {
  getAll: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  getById: async (id: string): Promise<Customer> => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  create: async (customer: CreateCustomerRequest): Promise<Customer> => {
    const { data } = await api.post('/customers', customer);
    return data;
  },

  update: async (id: string, customer: Partial<CreateCustomerRequest>): Promise<Customer> => {
    const { data } = await api.patch(`/customers/${id}`, customer);
    return data;
  },

  approve: async (id: string, status: 'approved' | 'pending'): Promise<Customer> => {
    const { data } = await api.patch(`/customers/${id}/approve`, { status });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },

  getPending: async (): Promise<Customer[]> => {
    const { data } = await api.get('/customers/pending');
    return data;
  },

  getStats: async () => {
    const { data } = await api.get('/customers/stats');
    return data;
  },
};