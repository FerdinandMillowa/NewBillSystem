import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  Min,
  IsBoolean,
} from 'class-validator';

export class UpdateProductDto {
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStock?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  shotsPerBottle?: number;

  @IsUUID()
  @IsOptional()
  linkedShotProductId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;
}
