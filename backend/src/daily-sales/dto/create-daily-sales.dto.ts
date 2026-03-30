import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DailyInventoryItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(0)
  openingStock: number;

  @IsNumber()
  @Min(0)
  stockIn: number;

  @IsNumber()
  @Min(0)
  closingStock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  convertedOut?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  convertedIn?: number;
}

export class DailyExpenseItemDto {
  @IsNotEmpty()
  @IsString()
  category: string; // utilities, supplies, wages, transport, maintenance, other

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string; // defaults to 'cash'
}

export class StockPurchaseItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDailySalesDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  // Revenue Collection
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

  // Bills amount (tracked separately)
  @IsNumber()
  @Min(0)
  @IsOptional()
  billsAmount?: number;

  // Manager's physical cash count
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualCashCollected?: number; // Manager's physical cash count

  // Inventory items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyInventoryItemDto)
  inventories: DailyInventoryItemDto[];

  // Expenses
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyExpenseItemDto)
  @IsOptional()
  expenses?: DailyExpenseItemDto[];

  // Stock purchases
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockPurchaseItemDto)
  @IsOptional()
  stockPurchases?: StockPurchaseItemDto[];

  @IsString()
  @IsOptional()
  notes?: string;
}
