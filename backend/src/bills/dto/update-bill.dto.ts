import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateBillDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
