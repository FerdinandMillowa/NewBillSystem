import { UserRole } from '../../common/enums';

export interface JwtPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: UserRole;
}

export interface JwtPayloadWithRefresh extends JwtPayload {
  refreshToken: string;
}
