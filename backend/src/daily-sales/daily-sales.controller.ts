import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DailySalesService } from './daily-sales.service';
import { CreateDailySalesDto } from './dto/create-daily-sales.dto';
import { UpdateDailySalesDto } from './dto/update-daily-sales.dto';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { QueryDailySalesDto } from './dto/query-daily-sales.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

@Controller('daily-sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailySalesController {
  constructor(private readonly dailySalesService: DailySalesService) {}

  // Create daily sales (any authenticated user)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDailySalesDto: CreateDailySalesDto) {
    return this.dailySalesService.create(createDailySalesDto);
  }

  // Get all daily sales with filters
  @Get()
  findAll(@Query() queryDto: QueryDailySalesDto) {
    return this.dailySalesService.findAll(queryDto);
  }

  // Get today's sales
  @Get('today')
  getToday() {
    return this.dailySalesService.getToday();
  }

  // Get weekly summary
  @Get('summary/weekly')
  getWeeklySummary(@Query('startDate') startDate?: string) {
    return this.dailySalesService.getWeeklySummary(startDate);
  }

  // Get monthly summary
  @Get('summary/monthly')
  getMonthlySummary(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    return this.dailySalesService.getMonthlySummary(year, month);
  }

  // Get single daily sales record
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailySalesService.findOne(id);
  }

  // Get by specific date
  @Get('date/:date')
  findByDate(@Param('date') date: string) {
    return this.dailySalesService.findByDate(date);
  }

  // Update daily sales
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDailySalesDto: UpdateDailySalesDto,
  ) {
    return this.dailySalesService.update(id, updateDailySalesDto);
  }

  // Finalize daily sales
  @Patch(':id/finalize')
  finalize(@Param('id') id: string) {
    return this.dailySalesService.finalize(id);
  }

  // Unlock daily sales (admin only)
  @Patch(':id/unlock')
  @Roles(UserRole.ADMIN)
  unlock(@Param('id') id: string) {
    return this.dailySalesService.unlock(id);
  }

  // Create inventory transfer (bottle to shot)
  @Post(':id/inventory-transfer')
  createInventoryTransfer(
    @Param('id') id: string,
    @Body() createTransferDto: CreateInventoryTransferDto,
    @CurrentUser() user: User,
  ) {
    return this.dailySalesService.createInventoryTransfer(
      id,
      createTransferDto,
      user.id,
    );
  }

  // Delete daily sales (admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.dailySalesService.remove(id);
  }
}
