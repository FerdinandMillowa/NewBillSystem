import api from './api';

export const reportsService = {
  getDashboard: async () => {
    const { data } = await api.get('/reports/dashboard');
    return data;
  },

  getDaily: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/daily', { params });
    return data;
  },

  getMonthly: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/monthly', { params });
    return data;
  },

  getOutstanding: async () => {
    const { data } = await api.get('/reports/outstanding');
    return data;
  },

  getPaymentMethods: async () => {
    const { data } = await api.get('/reports/payment-methods');
    return data;
  },

  getRevenue: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/revenue', { params });
    return data;
  },

  getTopCustomers: async (limit?: number) => {
    const { data } = await api.get('/reports/top-customers', { params: { limit } });
    return data;
  },
};