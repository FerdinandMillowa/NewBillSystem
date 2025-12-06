import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';
import {
  ActivityAction,
  ActivityEntity,
} from '../../database/entities/activity-log.entity';

export class CreateActivityLogDto {
  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEnum(ActivityAction)
  action: ActivityAction;

  @IsEnum(ActivityEntity)
  entity: ActivityEntity;

  @IsUUID()
  @IsOptional()
  entityId?: string;

  @IsObject()
  @IsOptional()
  details?: any; // Will be stringified

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
