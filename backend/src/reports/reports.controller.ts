import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN) // All reports are admin-only
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Get dashboard statistics
  @Get('dashboard')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  // Get daily report
  @Get('daily')
  getDailyReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getDailyReport(dateRangeDto);
  }

  // Get monthly report
  @Get('monthly')
  getMonthlyReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getMonthlyReport(dateRangeDto);
  }

  // Get outstanding balances
  @Get('outstanding')
  getOutstandingBalances() {
    return this.reportsService.getOutstandingBalances();
  }

  // Get payment method distribution
  @Get('payment-methods')
  getPaymentMethodDistribution() {
    return this.reportsService.getPaymentMethodDistribution();
  }

  // Get revenue report
  @Get('revenue')
  getRevenueReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getRevenueReport(dateRangeDto);
  }

  // Get top paying customers
  @Get('top-customers')
  getTopCustomers(@Query('limit') limit?: number) {
    return this.reportsService.getTopCustomers(limit);
  }
}
