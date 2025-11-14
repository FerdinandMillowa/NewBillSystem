import api from './api';
import type { Payment, CreatePaymentRequest } from '../types/payment.types';

export const paymentsService = {
  getAll: async (params?: {
    customerId?: string;
    paymentMethod?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/payments', { params });
    return data;
  },

  getById: async (id: string): Promise<Payment> => {
    const { data } = await api.get(`/payments/${id}`);
    return data;
  },

  getByCustomer: async (customerId: string): Promise<Payment[]> => {
    const { data } = await api.get(`/payments/customer/${customerId}`);
    return data;
  },

  create: async (payment: CreatePaymentRequest): Promise<Payment> => {
    const { data } = await api.post('/payments', payment);
    return data;
  },

  update: async (id: string, payment: Partial<CreatePaymentRequest>): Promise<Payment> => {
    const { data } = await api.patch(`/payments/${id}`, payment);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/payments/${id}`);
  },

  getStats: async () => {
    const { data } = await api.get('/payments/stats');
    return data;
  },

  getRecent: async (limit?: number) => {
    const { data } = await api.get('/payments/recent', { params: { limit } });
    return data;
  },
};