
import api from "./api";

export const dailySalesService = {
  // Create daily sales
  create: async (data: any) => {
    const response = await api.post("/daily-sales", data);
    return response.data;
  },

  // Update daily sales
  update: async (id: string, data: any) => {
    const response = await api.patch(`/daily-sales/${id}`, data);
    return response.data;
  },

  // Get all daily sales
  getAll: async (params?: any) => {
    const response = await api.get("/daily-sales", { params });
    return response.data;
  },

  // Get today's daily sales
  getToday: async () => {
    const response = await api.get("/daily-sales/today");
    return response.data;
  },

  // Get daily sales by ID
  getById: async (id: string) => {
    const response = await api.get(`/daily-sales/${id}`);
    return response.data;
  },

  // Get daily sales by date
  getByDate: async (date: string) => {
    const response = await api.get(`/daily-sales/date/${date}`);
    return response.data;
  },

  // UPDATED: Get bills for a specific date with optional dailySalesId
  getBillsForDate: async (date: string, dailySalesId?: string) => {
    const params: any = { date };
    if (dailySalesId) {
      params.dailySalesId = dailySalesId;
    }
    const response = await api.get(`/daily-sales/bills`, { params });
    return response.data;
  },

  // Get weekly summary
  getWeeklySummary: async (startDate?: string) => {
    const response = await api.get("/daily-sales/summary/weekly", {
      params: { startDate },
    });
    return response.data;
  },

  // Get monthly summary
  getMonthlySummary: async (year: number, month: number) => {
    const response = await api.get("/daily-sales/summary/monthly", {
      params: { year, month },
    });
    return response.data;
  },

  // Finalize daily sales
  finalize: async (id: string) => {
    const response = await api.patch(`/daily-sales/${id}/finalize`);
    return response.data;
  },

  // Unlock daily sales (admin only)
  unlock: async (id: string) => {
    const response = await api.patch(`/daily-sales/${id}/unlock`);
    return response.data;
  },

  // Create inventory transfer
  createInventoryTransfer: async (
    dailySalesId: string,
    data: {
      fromProductId: string;
      toProductId: string;
      quantity: number;
      notes?: string;
    }
  ) => {
    const response = await api.post(
      `/daily-sales/${dailySalesId}/inventory-transfer`,
      data
    );
    return response.data;
  },

  // Delete daily sales (admin only)
  delete: async (id: string) => {
    const response = await api.delete(`/daily-sales/${id}`);
    return response.data;
  },
};