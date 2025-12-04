import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // PROFILE ENDPOINTS (Any authenticated user)
  // ============================================

  // Get current user's profile
  @Get('profile/me')
  getMyProfile(@CurrentUser() currentUser: User) {
    return this.usersService.findOne(currentUser.id);
  }

  // Update current user's profile (non-sensitive fields only)
  @Patch('profile')
  updateMyProfile(
    @CurrentUser() currentUser: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Users can only update their own username, email, and fullName
    // Remove sensitive fields that users shouldn't change themselves
    const { role, status, password, ...allowedUpdates } = updateUserDto;
    return this.usersService.update(currentUser.id, allowedUpdates);
  }

  // Change current user's password
  @Patch('change-password')
  changeMyPassword(
    @CurrentUser() currentUser: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(currentUser.id, changePasswordDto);
  }

  // ============================================
  // ADMIN ENDPOINTS (User Management)
  // ============================================

  // Admin only - Create new user
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // Admin only - Get all users with filters
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() queryDto: QueryUsersDto) {
    return this.usersService.findAll(queryDto);
  }

  // Admin only - Get user statistics
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getUserStats() {
    return this.usersService.getUserStats();
  }

  // Get single user (admin or self)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Allow users to view their own profile or admin to view any profile
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new Error('You can only view your own profile');
    }
    return this.usersService.findOne(id);
  }

  // Admin only - Update any user (including sensitive fields)
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // Admin only - Reset user password
  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN)
  resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.usersService.resetPassword(id, newPassword);
  }

  // Admin only - Delete user
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    // Prevent admin from deleting themselves
    if (currentUser.id === id) {
      throw new Error('You cannot delete your own account');
    }
    return this.usersService.remove(id);
  }
}
