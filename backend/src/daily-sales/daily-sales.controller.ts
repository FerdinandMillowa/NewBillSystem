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
import { LogActivity } from '../common/decorators/log-activity.decorator';
import {
  ActivityAction,
  ActivityEntity,
} from '../database/entities/activity-log.entity';

@Controller('daily-sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DailySalesController {
  constructor(private readonly dailySalesService: DailySalesService) {}

  // Create daily sales (any authenticated user)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @LogActivity({
    action: ActivityAction.CREATE,
    entity: ActivityEntity.DAILY_SALES,
    getMessage: (result) => `Created daily sales for ${result.date}`,
  })
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

  // ✅ ADD THIS: Get or create draft for a specific date
  @Get('draft/:date')
  async getOrCreateDraft(@Param('date') date: string) {
    return this.dailySalesService.getOrCreateDraftForDate(date);
  }

  // Get bills for a specific date
  @Get('bills')
  getBillsForDate(
    @Query('date') date: string,
    @Query('dailySalesId') dailySalesId?: string,
  ) {
    return this.dailySalesService.getBillsForDate(date, dailySalesId);
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
  @LogActivity({
    action: ActivityAction.UPDATE,
    entity: ActivityEntity.DAILY_SALES,
    getMessage: (result) => `Updated daily sales for ${result.date}`,
  })
  update(
    @Param('id') id: string,
    @Body() updateDailySalesDto: UpdateDailySalesDto,
  ) {
    return this.dailySalesService.update(id, updateDailySalesDto);
  }

  // Finalize daily sales
  @Patch(':id/finalize')
  @LogActivity({
    action: ActivityAction.FINALIZE,
    entity: ActivityEntity.DAILY_SALES,
    getMessage: (result) => `Finalized daily sales for ${result.date}`,
  })
  finalize(@Param('id') id: string) {
    return this.dailySalesService.finalize(id);
  }

  // Unlock daily sales (admin only)
  @Patch(':id/unlock')
  @Roles(UserRole.ADMIN)
  @LogActivity({
    action: ActivityAction.UNLOCK,
    entity: ActivityEntity.DAILY_SALES,
    getMessage: (result) => `Unlocked daily sales for ${result.date}`,
  })
  unlock(@Param('id') id: string) {
    return this.dailySalesService.unlock(id);
  }

  // Update actual cash collected (admin only)
  @Patch(':id/actual-cash')
  @Roles(UserRole.ADMIN)
  @LogActivity({
    action: ActivityAction.UPDATE_CASH,
    entity: ActivityEntity.DAILY_SALES,
    getMessage: (result, params) =>
      `Updated actual cash for ${result.date} to MK ${params.body?.actualCashCollected}`,
  })
  async updateActualCash(
    @Param('id') id: string,
    @Body('actualCashCollected') actualCashCollected: number | null,
  ) {
    return this.dailySalesService.updateActualCashCollected(
      id,
      actualCashCollected,
    );
  }

  // Create inventory transfer (bottle to shot)
  @Post(':id/inventory-transfer')
  @LogActivity({
    action: ActivityAction.TRANSFER,
    entity: ActivityEntity.INVENTORY,
    getMessage: (result, params) =>
      `Created inventory transfer of ${params.body?.quantity} bottles to shots`,
  })
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
  @LogActivity({
    action: ActivityAction.DELETE,
    entity: ActivityEntity.DAILY_SALES,
    getMessage: (result, params) =>
      `Deleted daily sales record ID: ${params.params.id}`,
  })
  remove(@Param('id') id: string) {
    return this.dailySalesService.remove(id);
  }
}
