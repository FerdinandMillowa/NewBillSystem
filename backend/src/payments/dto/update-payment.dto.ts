import { IsOptional, IsNumber, IsString, Min, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../common/enums';

export class UpdatePaymentDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @IsString()
  @IsOptional()
  notes?: string;
}
