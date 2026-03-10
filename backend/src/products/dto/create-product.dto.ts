import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  unit?: string; // e.g., 'bottle', 'can', 'shot'

  @IsString()
  @IsOptional()
  size?: string; // e.g., '750ml', '330ml'

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  currentPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentStock?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  shotsPerBottle?: number; // For bottle-to-shot conversion

  @IsUUID()
  @IsOptional()
  linkedShotProductId?: string; // Link to shot version

  @IsString()
  @IsOptional()
  notes?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;
}
