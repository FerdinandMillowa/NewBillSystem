import { IsNotEmpty, IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateBillDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;
}
