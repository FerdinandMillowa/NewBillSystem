import api from './api';

export const reportsService = {

  getDashboard: async () => {
    const { data } = await api.get('/reports/dashboard');
    return data;
  },

  getMonthly: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/monthly', { params });
    return data;
  },

  getMonthlyBilling: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/monthly-billing', { params });
    return data;
  },

  getPaymentMethods: async () => {
    const { data } = await api.get('/reports/payment-methods');
    return data;
  },

  getBillingPaymentMethods: async (params?: { startDate?: string; endDate?: string }) => {
    const { data } = await api.get('/reports/billing/payment-methods', { params });
    return data;
  },

  getOutstandingBalances: async () => {
    const { data } = await api.get('/reports/outstanding-balances');
    return data;
  },

  getTopCustomers: async (limit?: number) => {
    const { data } = await api.get('/reports/top-customers', { params: { limit } });
    return data;
  },

  getTopBillers: async (limit?: number) => {
    const { data } = await api.get('/reports/top-billers', { params: { limit } });
    return data;
  },

  getTopPayers: async (limit?: number) => {
    const { data } = await api.get('/reports/top-payers', { params: { limit } });
    return data;
  },

  getOverdueCustomers: async (limit?: number) => {
    const { data } = await api.get('/reports/overdue-customers', { params: { limit } });
    return data;
  },

  getDailySalesSummary: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/summary', {
      params: { startDate, endDate },
    });
    return data;
  },

  getProductPerformance: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/product-performance', {
      params: { startDate, endDate },
    });
    return data;
  },

  getCategorySales: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/category-sales', {
      params: { startDate, endDate },
    });
    return data;
  },

  getExpenseAnalysis: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/expense-analysis', {
      params: { startDate, endDate },
    });
    return data;
  },

  getDailySalesPaymentMethods: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/payment-methods', {
      params: { startDate, endDate },
    });
    return data;
  },

  getShortageTracking: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/daily-sales/shortage-tracking', {
      params: { startDate, endDate },
    });
    return data;
  },

  getWeeklyComparison: async () => {
    const { data } = await api.get('/reports/daily-sales/weekly-comparison');
    return data;
  },

  // ── NEW: Profit / Loss & Business Position ────────────────────────────
  getProfitLoss: async (startDate: string, endDate: string) => {
    const { data } = await api.get('/reports/profit-loss', {
      params: { startDate, endDate },
    });
    return data;
  },

  // ── NEW: Supplier Analytics ───────────────────────────────────────────
  getSupplierAnalytics: async (startDate?: string, endDate?: string) => {
    const { data } = await api.get('/reports/supplier-analytics', {
      params: { startDate, endDate },
    });
    return data;
  },

  exportReport: async (type: 'csv' | 'pdf', params?: any) => {
    const { data } = await api.get(`/reports/export/${type}`, {
      params,
      responseType: 'blob',
    });
    return data;
  },
};