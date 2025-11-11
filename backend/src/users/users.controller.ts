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

  // Admin only - Update user
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  // Change own password
  @Patch(':id/change-password')
  changePassword(
    @Param('id') id: string,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() currentUser: User,
  ) {
    // Users can only change their own password
    if (currentUser.id !== id) {
      throw new Error('You can only change your own password');
    }
    return this.usersService.changePassword(id, changePasswordDto);
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
