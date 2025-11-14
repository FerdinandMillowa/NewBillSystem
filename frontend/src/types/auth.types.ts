export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "user";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
