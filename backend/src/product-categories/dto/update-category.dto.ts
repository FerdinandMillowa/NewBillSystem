import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
