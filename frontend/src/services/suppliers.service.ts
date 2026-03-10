import api from './api';

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export const suppliersService = {
  getAll: async (): Promise<Supplier[]> => {
    const { data } = await api.get('/suppliers');
    return data;
  },

  getOne: async (id: string): Promise<Supplier> => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data;
  },

  create: async (dto: CreateSupplierDto): Promise<Supplier> => {
    const { data } = await api.post('/suppliers', dto);
    return data;
  },

  update: async (id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> => {
    const { data } = await api.put(`/suppliers/${id}`, dto);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};