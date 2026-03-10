import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { FixedExpenseCategory } from '../../database/entities/fixed-expense.entity';
import { PaymentMethod } from '../../common/enums';

export class CreateFixedExpenseDto {
  @IsEnum(FixedExpenseCategory)
  @IsNotEmpty()
  category: FixedExpenseCategory;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsDateString()
  @IsNotEmpty()
  expenseDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
