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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums';
import { User } from '../database/entities/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Record new payment (any authenticated user)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: User,
  ) {
    return this.paymentsService.create(createPaymentDto, user.role);
  }

  // Get all payments with filters (any authenticated user)
  @Get()
  findAll(@Query() queryDto: QueryPaymentsDto) {
    return this.paymentsService.findAll(queryDto);
  }

  // Get payment statistics (any authenticated user)
  @Get('stats')
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  // Get recent payments (any authenticated user)
  @Get('recent')
  getRecentPayments(@Query('limit') limit?: number) {
    return this.paymentsService.getRecentPayments(limit);
  }

  // Get single payment (any authenticated user)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  // Get payments by customer (any authenticated user)
  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.paymentsService.findByCustomer(customerId);
  }

  // Verify a payment (admin only)
  @Patch(':id/verify')
  @Roles(UserRole.ADMIN)
  verify(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentsService.verify(id, user.id);
  }

  // Update payment (any authenticated user)
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
