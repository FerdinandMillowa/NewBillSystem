import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateBillDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsOptional()
  @IsUUID()
  dailySalesId?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
