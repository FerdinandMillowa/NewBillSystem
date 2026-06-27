import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponse } from './interfaces/auth-response.interface';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { LogActivity } from '../common/decorators/log-activity.decorator';
import {
  ActivityAction,
  ActivityEntity,
} from '../database/entities/activity-log.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @LogActivity({
    action: ActivityAction.REGISTER,
    entity: ActivityEntity.USER,
    getMessage: (result) =>
      `Registered new user: ${result.user?.email || result.email}`,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @LogActivity({
    action: ActivityAction.LOGIN,
    entity: ActivityEntity.AUTH,
    getMessage: (result, params) =>
      `User logged in: ${params.body?.email || params.body?.username}`,
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @LogActivity({
    action: ActivityAction.REFRESH_TOKEN,
    entity: ActivityEntity.AUTH,
    getMessage: () => `User refreshed token`,
  })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Req() req: any,
  ): Promise<AuthResponse> {
    // Extract user from token
    const decoded = this.authService['jwtService'].decode(
      refreshTokenDto.refreshToken,
    );
    return this.authService.refreshToken(
      decoded.sub,
      refreshTokenDto.refreshToken,
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @LogActivity({
    action: ActivityAction.LOGOUT,
    entity: ActivityEntity.AUTH,
    getMessage: (result, params) => `User logged out`,
  })
  async logout(@CurrentUser() user: User): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<Partial<User>> {
    const { password, refreshToken, ...result } = user;
    return result;
  }

  @Get('register')
  getRegisterTest() {
    return {
      message:
        'Use POST /api/auth/register with email, password, and name in the request body',
    };
  }
}
