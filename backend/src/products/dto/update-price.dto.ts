import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdatePriceDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  newPrice: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
