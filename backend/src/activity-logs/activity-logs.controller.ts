import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  // Create activity log (internal use - typically not exposed)
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createActivityLogDto: CreateActivityLogDto) {
    return this.activityLogsService.create(createActivityLogDto);
  }

  // Get all activity logs with filters (admin only)
  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() queryDto: QueryActivityLogsDto) {
    return this.activityLogsService.findAll(queryDto);
  }

  // Get action statistics (admin only)
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getActionStats() {
    return this.activityLogsService.getActionStats();
  }

  // Get activity timeline (admin only)
  @Get('timeline')
  @Roles(UserRole.ADMIN)
  getActivityTimeline(@Query('days') days?: number) {
    return this.activityLogsService.getActivityTimeline(days);
  }

  // Get recent activity (admin only)
  @Get('recent')
  @Roles(UserRole.ADMIN)
  getRecentActivity(@Query('limit') limit?: number) {
    return this.activityLogsService.getRecentActivity(limit);
  }

  // Get current user's activity
  @Get('me')
  getMyActivity(@CurrentUser() user: User, @Query('limit') limit?: number) {
    return this.activityLogsService.findByUser(user.id, limit);
  }

  // Get user activity stats (admin only)
  @Get('user/:userId/stats')
  @Roles(UserRole.ADMIN)
  getUserActivityStats(@Param('userId') userId: string) {
    return this.activityLogsService.getUserActivityStats(userId);
  }

  // Get activity logs for specific user (admin only)
  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  findByUser(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.activityLogsService.findByUser(userId, limit);
  }

  // Clear old logs (admin only)
  @Delete('cleanup')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  clearOldLogs(@Query('days') days?: number) {
    return this.activityLogsService.clearOldLogs(days);
  }
}
