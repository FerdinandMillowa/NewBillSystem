
export interface UserProfile {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: 'admin' | 'user';
    status: 'active' | 'inactive';
    createdAt: string;
    updatedAt: string;
  }
  
  export interface UpdateProfileRequest {
    username?: string;
    email?: string;
    fullName?: string;
  }
  
  export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
  }
  
  export interface SystemPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    dateFormat: string;
    timeZone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  }