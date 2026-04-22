import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  IsEnum,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { PaymentMethod } from '../../common/enums';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;
}
