/* eslint-disable @typescript-eslint/no-explicit-any */

import api from './api';

export const reportsService = {

  // Get dashboard overview
  getDashboard: async () => {
    const { data } = await api.get('/reports/dashboard');
    return data;
  },

  // Get monthly report
  getMonthly: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/monthly', { params });
    return data;
  },

  // Get payment methods distribution for TODAY'S daily sales (billing module)
  getPaymentMethods: async () => {
    const { data } = await api.get('/reports/payment-methods');
    return data;
  },

  // NEW: Get billing payment methods (all payments from payments table)
  getBillingPaymentMethods: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/billing/payment-methods', { params });
    return data;
  },

  // Get outstanding balances
  getOutstandingBalances: async () => {
    const { data } = await api.get('/reports/outstanding-balances');
    return data;
  },

  // Get top customers
  getTopCustomers: async (limit?: number) => {
    const { data } = await api.get('/reports/top-customers', { params: { limit } });
    return data;
  },

  // ========================================
  // DAILY SALES ANALYTICS ENDPOINTS
  // ========================================

  // Get daily sales summary
  getDailySalesSummary: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/summary', {
      params: { startDate, endDate },
    });
    return data;
  },

  // Get product performance
  getProductPerformance: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/product-performance', {
      params: { startDate, endDate },
    });
    return data;
  },

  // Get category-wise sales
  getCategorySales: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/category-sales', {
      params: { startDate, endDate },
    });
    return data;
  },

  // Get expense analysis
  getExpenseAnalysis: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/expense-analysis', {
      params: { startDate, endDate },
    });
    return data;
  },

  // Get daily sales payment methods
  getDailySalesPaymentMethods: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/payment-methods', {
      params: { startDate, endDate },
    });
    return data;
  },

  // Get shortage tracking
  getShortageTracking: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/shortage-tracking', {
      params: { startDate, endDate },
    });
    return data;
  },

  // Get weekly comparison
  getWeeklyComparison: async () => {
    const { data } = await api.get('/reports/daily-sales/weekly-comparison');
    return data;
  },

  // Export functionality
  exportReport: async (type: 'csv' | 'pdf', params?: any) => {
    const { data } = await api.get(`/reports/export/${type}`, { 
      params,
      responseType: 'blob'
    });
    return data;
  },
};