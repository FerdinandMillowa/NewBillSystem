import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateInventoryTransferDto {
  @IsNotEmpty()
  @IsString()
  fromProductId: string; // e.g., Jameson 750ml

  @IsNotEmpty()
  @IsString()
  toProductId: string; // e.g., Jameson Shot

  @IsNumber()
  @Min(1)
  quantity: number; // Number of bottles to open

  @IsString()
  @IsOptional()
  notes?: string;
}
