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
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { QueryBillsDto } from './dto/query-bills.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('bills')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  // Create new bill (any authenticated user)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createBillDto: CreateBillDto) {
    return this.billsService.create(createBillDto);
  }

  // Get all bills with filters (any authenticated user)
  @Get()
  findAll(@Query() queryDto: QueryBillsDto) {
    return this.billsService.findAll(queryDto);
  }

  // Get bill statistics (ANY authenticated user can view)
  @Get('stats')
  getBillStats() {
    return this.billsService.getBillStats();
  }

  // Get recent bills (ANY authenticated user can view)
  @Get('recent')
  getRecentBills(@Query('limit') limit?: number) {
    return this.billsService.getRecentBills(limit);
  }

  // Get single bill (any authenticated user)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billsService.findOne(id);
  }

  // Get bills by customer (any authenticated user)
  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.billsService.findByCustomer(customerId);
  }

  // Update bill (any authenticated user)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billsService.update(id, updateBillDto);
  }

  // Delete bill (admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.billsService.remove(id);
  }
}
