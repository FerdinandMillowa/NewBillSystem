import api from './api';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
}

export interface UserQueryParams {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const usersService = {
  // Get all users (admin only)
  getAll: async (params: UserQueryParams = {}) => {
    const { data } = await api.get('/users', { params });
    return data;
  },

  // Get user stats (admin only)
  getStats: async () => {
    const { data } = await api.get('/users/stats');
    return data;
  },

  // Get single user
  getById: async (id: string) => {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  // Create user (admin only)
  create: async (userData: CreateUserRequest) => {
    const { data } = await api.post('/users', userData);
    return data;
  },

  // Update user (admin only)
  update: async (id: string, userData: UpdateUserRequest) => {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  // Reset password (admin only)
  resetPassword: async (id: string, newPassword: string) => {
    const { data } = await api.patch(`/users/${id}/reset-password`, {
      newPassword,
    });
    return data;
  },

  // Delete user (admin only)
  delete: async (id: string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  },
};