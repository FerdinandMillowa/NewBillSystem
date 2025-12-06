import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import {
  LOG_ACTIVITY_KEY,
  LogActivityMetadata,
} from '../decorators/log-activity.decorator';
import {
  ActivityAction,
  ActivityEntity,
} from '../../database/entities/activity-log.entity';

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const logMetadata = this.reflector.get<LogActivityMetadata>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );

    if (!logMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;
    const body = request.body;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const entityId = result?.id || params?.id || body?.id;

          const details: any = {
            method: request.method,
            url: request.url,
          };

          // Add custom message if provided
          if (logMetadata.getMessage) {
            details.message = logMetadata.getMessage(result, { params, body });
          }

          // Add relevant data based on entity type
          if (result) {
            if (result.name) details.name = result.name;
            if (result.email) details.email = result.email;
            if (result.amount) details.amount = result.amount;
            if (result.status) details.status = result.status;
            if (result.date) details.date = result.date;
          }

          // Extract IP address
          const ipAddress =
            request.ip ||
            request.connection?.remoteAddress ||
            request.headers['x-forwarded-for'] ||
            request.headers['x-real-ip'];

          // Extract user agent
          const userAgent = request.headers['user-agent'];

          await this.activityLogsService.log(
            logMetadata.action, // This is already ActivityAction from decorator
            logMetadata.entity, // This is already ActivityEntity from decorator
            user?.id,
            entityId,
            details,
            ipAddress,
            userAgent,
          );
        } catch (error) {
          // Don't throw errors for logging failures
          console.error('Activity logging failed:', error);
        }
      }),
    );
  }
}
