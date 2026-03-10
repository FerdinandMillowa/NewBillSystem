import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { FixedExpenseCategory } from '../../database/entities/fixed-expense.entity';
import { PaymentMethod } from '../../common/enums';

export class UpdateFixedExpenseDto {
  @IsOptional()
  @IsEnum(FixedExpenseCategory)
  category?: FixedExpenseCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
