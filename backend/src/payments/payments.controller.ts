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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Record new payment (authenticated users)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  // Get all payments with filters (authenticated users)
  @Get()
  findAll(@Query() queryDto: QueryPaymentsDto) {
    return this.paymentsService.findAll(queryDto);
  }

  // Get payment statistics (admin only)
  @Get('stats')
  @Roles(UserRole.ADMIN)
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  // Get recent payments (admin only)
  @Get('recent')
  @Roles(UserRole.ADMIN)
  getRecentPayments(@Query('limit') limit?: number) {
    return this.paymentsService.getRecentPayments(limit);
  }

  // Get single payment
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  // Get payments by customer
  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.paymentsService.findByCustomer(customerId);
  }

  // Update payment
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  // Delete payment (admin only)
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
