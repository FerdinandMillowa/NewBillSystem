import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { DateRangeDto } from './dto/date-range.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { OutstandingBalance, TopCustomer } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Get dashboard statistics (ANY authenticated user can view)
  @Get('dashboard')
  getDashboardStats() {
    return this.reportsService.getDashboardStats();
  }

  // Get payment method distribution for TODAY'S daily sales
  @Get('payment-methods')
  getPaymentMethodDistribution() {
    return this.reportsService.getPaymentMethodDistribution();
  }

  // NEW ENDPOINT: Get billing payment methods (from payments table)
  @Get('billing/payment-methods')
  getBillingPaymentMethods(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getBillingPaymentMethods(dateRangeDto);
  }

  // Get monthly report (ANY authenticated user can view)
  @Get('monthly')
  getMonthlyReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getMonthlyReport(dateRangeDto);
  }

  // Get weekly comparison (ANY authenticated user can view)
  @Get('weekly-comparison')
  getWeeklyComparison() {
    return this.reportsService.getWeeklyComparison();
  }

  // Get list of outstanding balances
  @Get('outstanding-balances')
  @Roles(UserRole.ADMIN)
  getOutstandingBalances(): Promise<OutstandingBalance[]> {
    return this.reportsService.getOutstandingBalances();
  }

  // Get top customers (based on total payments)
  @Get('top-customers')
  @Roles(UserRole.ADMIN)
  getTopCustomers(@Query('limit') limit?: number): Promise<TopCustomer[]> {
    return this.reportsService.getTopCustomers(limit);
  }

  // ========================================
  // DAILY SALES ANALYTICS ENDPOINTS
  // ========================================

  // Get daily sales summary
  @Get('daily-sales/summary')
  getDailySalesSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDailySalesSummary(startDate, endDate);
  }

  // Get product performance
  @Get('daily-sales/product-performance')
  getProductPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProductPerformance(startDate, endDate);
  }

  // Get category-wise sales
  @Get('daily-sales/category-sales')
  getCategorySales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCategorySales(startDate, endDate);
  }

  // Get expense analysis
  @Get('daily-sales/expense-analysis')
  getExpenseAnalysis(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getExpenseAnalysis(startDate, endDate);
  }

  // Get payment methods distribution for daily sales
  @Get('daily-sales/payment-methods')
  getDailySalesPaymentMethods(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDailySalesPaymentMethods(startDate, endDate);
  }

  // Get shortage tracking
  @Get('daily-sales/shortage-tracking')
  getShortageTracking(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getShortageTracking(startDate, endDate);
  }

  // Get weekly comparison for daily sales
  @Get('daily-sales/weekly-comparison')
  getDailySalesWeeklyComparison() {
    return this.reportsService.getWeeklyComparison();
  }
}
