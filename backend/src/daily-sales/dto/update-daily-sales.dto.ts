import {
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  DailyInventoryItemDto,
  DailyExpenseItemDto,
  StockPurchaseItemDto,
} from './create-daily-sales.dto';

export class UpdateDailySalesDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  cash?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  airtelMoney?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  mpamba?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bank?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  billsAmount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyInventoryItemDto)
  @IsOptional()
  inventories?: DailyInventoryItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyExpenseItemDto)
  @IsOptional()
  expenses?: DailyExpenseItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockPurchaseItemDto)
  @IsOptional()
  stockPurchases?: StockPurchaseItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
