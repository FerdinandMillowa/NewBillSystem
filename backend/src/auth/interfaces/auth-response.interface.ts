import { UserRole } from '../../common/enums';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
  };
}
