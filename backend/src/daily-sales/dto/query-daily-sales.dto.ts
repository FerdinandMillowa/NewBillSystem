import {
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDailySalesDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string; // 'draft' or 'finalized'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 30;
}
