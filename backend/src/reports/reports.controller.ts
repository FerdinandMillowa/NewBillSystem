import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Get dashboard statistics (ANY authenticated user can view)
  // FIXED: Removed admin-only restriction for dashboard stats
  // This is used on the main dashboard page for cards/charts
  @Get('dashboard')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  // Get payment method distribution (ANY authenticated user can view)
  // FIXED: Used in dashboard charts, should be accessible to all
  @Get('payment-methods')
  getPaymentMethodDistribution() {
    return this.reportsService.getPaymentMethodDistribution();
  }

  // Get monthly report (ANY authenticated user can view)
  // FIXED: Used in dashboard charts, should be accessible to all
  @Get('monthly')
  getMonthlyReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getMonthlyReport(dateRangeDto);
  }

  // ========== ADMIN-ONLY REPORTS BELOW ==========
  // These are for the dedicated Reports & Analytics page

  // Get daily report (admin only)
  @Get('daily')
  @Roles(UserRole.ADMIN)
  getDailyReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getDailyReport(dateRangeDto);
  }

  // Get outstanding balances (admin only)
  @Get('outstanding')
  @Roles(UserRole.ADMIN)
  getOutstandingBalances() {
    return this.reportsService.getOutstandingBalances();
  }

  // Get revenue report (admin only)
  @Get('revenue')
  @Roles(UserRole.ADMIN)
  getRevenueReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getRevenueReport(dateRangeDto);
  }

  // Get top paying customers (admin only)
  @Get('top-customers')
  @Roles(UserRole.ADMIN)
  getTopCustomers(@Query('limit') limit?: number) {
    return this.reportsService.getTopCustomers(limit);
  }
}
