import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';

@Injectable()
export class ActivityLoggerInterceptor implements NestInterceptor {
  constructor(private activityLogsService: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, method, url, ip, headers } = request;

    // Define which actions to log
    const actionsToLog = ['POST', 'PATCH', 'PUT', 'DELETE'];

    if (actionsToLog.includes(method)) {
      const action = this.getActionName(method, url);
      const userAgent = headers['user-agent'] || 'Unknown';

      return next.handle().pipe(
        tap(() => {
          // Log after successful request
          this.activityLogsService.log(
            action,
            user?.id,
            `${method} ${url}`,
            ip,
            userAgent,
          );
        }),
      );
    }

    return next.handle();
  }

  private getActionName(method: string, url: string): string {
    // Parse URL to create meaningful action names
    if (url.includes('/auth/login')) return 'User Login';
    if (url.includes('/auth/register')) return 'User Registration';
    if (url.includes('/auth/logout')) return 'User Logout';
    if (url.includes('/customers') && method === 'POST')
      return 'Customer Created';
    if (url.includes('/customers') && method === 'PATCH')
      return 'Customer Updated';
    if (url.includes('/customers') && method === 'DELETE')
      return 'Customer Deleted';
    if (url.includes('/approve')) return 'Customer Approved';
    if (url.includes('/bills') && method === 'POST') return 'Bill Created';
    if (url.includes('/bills') && method === 'PATCH') return 'Bill Updated';
    if (url.includes('/bills') && method === 'DELETE') return 'Bill Deleted';
    if (url.includes('/payments') && method === 'POST')
      return 'Payment Recorded';
    if (url.includes('/payments') && method === 'PATCH')
      return 'Payment Updated';
    if (url.includes('/payments') && method === 'DELETE')
      return 'Payment Deleted';
    if (url.includes('/users') && method === 'POST') return 'User Created';
    if (url.includes('/users') && method === 'PATCH') return 'User Updated';
    if (url.includes('/users') && method === 'DELETE') return 'User Deleted';

    return `${method} ${url}`;
  }
}
