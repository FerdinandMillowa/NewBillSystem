import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ActivityLog,
  ActivityAction,
  ActivityEntity,
} from '../database/entities/activity-log.entity';
import { User } from '../database/entities/user.entity';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    createActivityLogDto: CreateActivityLogDto,
  ): Promise<ActivityLog> {
    // Create activity log object with explicit typing
    const activityLogData: Partial<ActivityLog> = {
      userId: createActivityLogDto.userId || undefined, // Convert empty to undefined
      action: createActivityLogDto.action,
      entity: createActivityLogDto.entity,
      entityId: createActivityLogDto.entityId || undefined,
      details: createActivityLogDto.details
        ? JSON.stringify(createActivityLogDto.details)
        : undefined,
      ipAddress: createActivityLogDto.ipAddress || undefined,
      userAgent: createActivityLogDto.userAgent || undefined,
    };

    const activityLog = this.activityLogRepository.create(activityLogData);
    return this.activityLogRepository.save(activityLog);
  }

  async log(
    action: ActivityAction,
    entity: ActivityEntity,
    userId?: string,
    entityId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ActivityLog> {
    // Create activity log object with explicit typing
    const activityLogData: Partial<ActivityLog> = {
      userId: userId || undefined,
      action,
      entity,
      entityId: entityId || undefined,
      details: details ? JSON.stringify(details) : undefined,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    };

    const activityLog = this.activityLogRepository.create(activityLogData);
    return this.activityLogRepository.save(activityLog);
  }

  async findAll(queryDto: QueryActivityLogsDto): Promise<{
    logs: ActivityLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      userId,
      action,
      entity,
      entityId,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = queryDto;

    const queryBuilder = this.activityLogRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    // Filter by user
    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    // Filter by action
    if (action) {
      queryBuilder.andWhere('log.action = :action', { action });
    }

    // Filter by entity
    if (entity) {
      queryBuilder.andWhere('log.entity = :entity', { entity });
    }

    // Filter by entity ID
    if (entityId) {
      queryBuilder.andWhere('log.entityId = :entityId', { entityId });
    }

    // Search in details
    if (search) {
      queryBuilder.andWhere('log.details ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Date range filter
    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('log.createdAt', 'DESC');

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      total,
      page,
      limit,
    };
  }

  async findByUser(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    const logs = await this.activityLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    const logs = await this.activityLogRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return logs.map((log) => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }));
  }

  async getActionStats(): Promise<any> {
    const actionStats = await this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.action')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    const totalLogs = await this.activityLogRepository.count();

    return {
      total: totalLogs,
      actions: actionStats.map((item) => ({
        action: item.action,
        count: parseInt(item.count),
        percentage:
          totalLogs > 0
            ? parseFloat(((parseInt(item.count) / totalLogs) * 100).toFixed(2))
            : 0,
      })),
    };
  }

  async getUserActivityStats(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    const totalActions = await this.activityLogRepository.count({
      where: { userId },
    });

    const actionBreakdown = await this.activityLogRepository
      .createQueryBuilder('log')
      .select('log.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .where('log.userId = :userId', { userId })
      .groupBy('log.action')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    const lastActivity = await this.activityLogRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
      totalActions,
      actionBreakdown: actionBreakdown.map((item) => ({
        action: item.action,
        count: parseInt(item.count),
      })),
      lastActivity: lastActivity?.createdAt || null,
    };
  }

  async getActivityTimeline(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeline = await this.activityLogRepository
      .createQueryBuilder('log')
      .select("TO_CHAR(log.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('log.createdAt >= :startDate', { startDate })
      .groupBy("TO_CHAR(log.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(log.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    return timeline.map((item) => ({
      date: item.date,
      count: parseInt(item.count),
    }));
  }

  async clearOldLogs(daysToKeep: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.activityLogRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return { deleted: result.affected || 0 };
  }
}
