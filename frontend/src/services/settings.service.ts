
import api from './api';
import type { UpdateProfileRequest, ChangePasswordRequest, SystemPreferences } from '../types/settings.types';

export const settingsService = {
  // User profile
  getProfile: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  updateProfile: async (profileData: UpdateProfileRequest) => {
    const { data } = await api.patch('/users/profile', profileData);
    return data;
  },

  changePassword: async (passwordData: ChangePasswordRequest) => {
    const { data } = await api.patch('/users/change-password', passwordData);
    return data;
  },

  // System preferences (stored locally for now)
  getPreferences: (): SystemPreferences => {
    const stored = localStorage.getItem('system-preferences');
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      theme: 'light',
      language: 'en',
      dateFormat: 'MMM dd, yyyy',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    };
  },

  savePreferences: (preferences: SystemPreferences) => {
    localStorage.setItem('system-preferences', JSON.stringify(preferences));
    return preferences;
  },
};