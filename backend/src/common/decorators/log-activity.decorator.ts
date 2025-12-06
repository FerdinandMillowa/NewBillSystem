import { SetMetadata } from '@nestjs/common';
import {
  ActivityAction,
  ActivityEntity,
} from '../../database/entities/activity-log.entity';

export interface LogActivityMetadata {
  action: ActivityAction;
  entity: ActivityEntity;
  getMessage?: (result: any, params?: any) => string;
}

export const LOG_ACTIVITY_KEY = 'log_activity';

export const LogActivity = (metadata: LogActivityMetadata) =>
  SetMetadata(LOG_ACTIVITY_KEY, metadata);
