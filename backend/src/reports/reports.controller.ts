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

  // Get billing payment methods (from payments table)
  @Get('billing/payment-methods')
  getBillingPaymentMethods(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getBillingPaymentMethods(dateRangeDto);
  }

  // Get monthly report (ANY authenticated user can view)
  @Get('monthly')
  getMonthlyReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getMonthlyReport(dateRangeDto);
  }

  // Get monthly billing report (for Customer Billing module)
  @Get('monthly-billing')
  getMonthlyBillingReport(@Query() dateRangeDto: DateRangeDto) {
    return this.reportsService.getMonthlyBillingReport(dateRangeDto);
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

  // Get top billers
  @Get('top-billers')
  getTopBillers(@Query('limit') limit?: number) {
    return this.reportsService.getTopBillers(limit);
  }

  // Get top payers
  @Get('top-payers')
  getTopPayers(@Query('limit') limit?: number) {
    return this.reportsService.getTopPayers(limit);
  }

  // Get customers with overdue balances
  @Get('overdue-customers')
  getOverdueCustomers(@Query('limit') limit?: number) {
    return this.reportsService.getCustomersWithOverdueBalances(limit);
  }

  // ── NEW: Profit / Loss & Business Position report ──────────────────────
  @Get('profit-loss')
  getProfitLossReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getProfitLossReport(startDate, endDate);
  }

  // ── NEW: Supplier Analytics ────────────────────────────────────────────
  @Get('supplier-analytics')
  getSupplierAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSupplierAnalytics(startDate, endDate);
  }

  // ========================================
  // DAILY SALES ANALYTICS ENDPOINTS
  // ========================================

  @Get('daily-sales/summary')
  getDailySalesSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDailySalesSummary(startDate, endDate);
  }

  @Get('daily-sales/product-performance')
  getProductPerformance(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getProductPerformance(startDate, endDate);
  }

  @Get('daily-sales/category-sales')
  getCategorySales(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getCategorySales(startDate, endDate);
  }

  @Get('daily-sales/expense-analysis')
  getExpenseAnalysis(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getExpenseAnalysis(startDate, endDate);
  }

  @Get('daily-sales/payment-methods')
  getDailySalesPaymentMethods(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getDailySalesPaymentMethods(startDate, endDate);
  }

  @Get('daily-sales/shortage-tracking')
  getShortageTracking(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getShortageTracking(startDate, endDate);
  }

  @Get('daily-sales/weekly-comparison')
  getDailySalesWeeklyComparison() {
    return this.reportsService.getWeeklyComparison();
  }
}
