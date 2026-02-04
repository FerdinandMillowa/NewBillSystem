import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';
import { DailySales } from '../database/entities/daily-sales.entity';
import { DailyInventory } from '../database/entities/daily-inventory.entity';
import { DailyExpense } from '../database/entities/daily-expense.entity';
import { Product } from '../database/entities/product.entity';
import { ProductCategory } from '../database/entities/product-category.entity';
import { StockPurchase } from '../database/entities/stock-purchase.entity';
import { CustomerStatus } from '../common/enums';
import { DateRangeDto } from './dto/date-range.dto';
import { format, subDays, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface OutstandingBalance {
  customerId: string;
  customerName: string;
  email: string;
  phone: string;
  totalBills: number;
  totalPayments: number;
  balance: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalPaid: number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(DailySales)
    private dailySalesRepository: Repository<DailySales>,
    @InjectRepository(DailyInventory)
    private dailyInventoryRepository: Repository<DailyInventory>,
    @InjectRepository(DailyExpense)
    private dailyExpenseRepository: Repository<DailyExpense>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private productCategoryRepository: Repository<ProductCategory>,
    @InjectRepository(StockPurchase)
    private stockPurchaseRepository: Repository<StockPurchase>,
  ) {}

  async getDashboardStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      totalActiveCustomers,
      totalBills,
      totalBillsAmount,
      totalPayments,
      totalPaymentsAmount,
      todaySales,
      thisMonthSales,
    ] = await Promise.all([
      this.customerRepository.count(),
      this.customerRepository.count({
        where: { status: CustomerStatus.APPROVED },
      }),
      this.billRepository.count(),
      this.billRepository
        .createQueryBuilder('bill')
        .select('SUM(bill.amount)', 'total')
        .getRawOne(),
      this.paymentRepository.count(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .getRawOne(),
      this.dailySalesRepository.findOne({ where: { date: today } }),
      this.dailySalesRepository
        .createQueryBuilder('sales')
        .select('SUM(sales.total_sales)', 'totalSales')
        .where('EXTRACT(MONTH FROM sales.date) = :month', {
          month: today.getMonth() + 1,
        })
        .andWhere('EXTRACT(YEAR FROM sales.date) = :year', {
          year: today.getFullYear(),
        })
        .getRawOne(),
    ]);

    const billsAmount = parseFloat(totalBillsAmount?.total || '0');
    const paymentsAmount = parseFloat(totalPaymentsAmount?.total || '0');
    const outstanding = billsAmount - paymentsAmount;

    return {
      customers: {
        total: totalCustomers,
        approved: totalActiveCustomers,
        pending: totalCustomers - totalActiveCustomers,
      },
      bills: {
        total: totalBills,
        amount: billsAmount,
      },
      payments: {
        total: totalPayments,
        amount: paymentsAmount,
      },
      revenue: {
        outstanding: outstanding > 0 ? outstanding : 0,
        collected: paymentsAmount,
        collectionRate:
          billsAmount > 0 ? (paymentsAmount / billsAmount) * 100 : 0,
      },
      todayTotalSales: todaySales
        ? parseFloat(todaySales.totalSales?.toString() || '0')
        : 0,
      todayTotalCollected: todaySales
        ? parseFloat(todaySales.totalCollected?.toString() || '0')
        : 0,
      thisMonthSales: parseFloat(thisMonthSales?.totalSales || '0'),
    };
  }

  async getPaymentMethodDistribution(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await this.dailySalesRepository.findOne({
      where: { date: today },
    });

    if (!todaySales) {
      return {
        cash: 0,
        airtelMoney: 0,
        mpamba: 0,
        bank: 0,
        total: 0,
        breakdown: [],
      };
    }

    const cash = parseFloat(todaySales.cash?.toString() || '0');
    const airtelMoney = parseFloat(todaySales.airtelMoney?.toString() || '0');
    const mpamba = parseFloat(todaySales.mpamba?.toString() || '0');
    const bank = parseFloat(todaySales.bank?.toString() || '0');
    const total = cash + airtelMoney + mpamba + bank;

    return {
      cash,
      airtelMoney,
      mpamba,
      bank,
      total,
      breakdown: [
        {
          method: 'cash',
          name: 'Cash',
          amount: cash,
          percentage: total > 0 ? (cash / total) * 100 : 0,
        },
        {
          method: 'airtel_money',
          name: 'Airtel Money',
          amount: airtelMoney,
          percentage: total > 0 ? (airtelMoney / total) * 100 : 0,
        },
        {
          method: 'mpamba',
          name: 'Mpamba',
          amount: mpamba,
          percentage: total > 0 ? (mpamba / total) * 100 : 0,
        },
        {
          method: 'bank',
          name: 'Bank',
          amount: bank,
          percentage: total > 0 ? (bank / total) * 100 : 0,
        },
      ].filter((item) => item.amount > 0),
    };
  }

  // NEW METHOD: Get billing payment methods (from payments table)
  async getBillingPaymentMethods(dateRangeDto?: DateRangeDto): Promise<any> {
    let startDate: Date;
    let endDate: Date;

    if (dateRangeDto?.startDate && dateRangeDto?.endDate) {
      startDate = new Date(dateRangeDto.startDate);
      endDate = new Date(dateRangeDto.endDate);
    } else {
      // Default to all time
      startDate = new Date(2000, 0, 1); // Very old date
      endDate = new Date();
    }

    // Get all payments within date range
    const payments = await this.paymentRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
      relations: ['customer'],
    });

    const methodTotals = {
      cash: 0,
      airtel_money: 0,
      mpamba: 0,
      bank: 0,
      total: 0,
    };

    payments.forEach((payment) => {
      const method = payment.paymentMethod?.toLowerCase() || 'cash';
      const amount = parseFloat(payment.amount?.toString() || '0');

      // Map payment method to our categories
      let mappedMethod = 'cash';
      if (method.includes('airtel') || method.includes('airtel_money')) {
        mappedMethod = 'airtel_money';
      } else if (method.includes('mpamba')) {
        mappedMethod = 'mpamba';
      } else if (method.includes('bank')) {
        mappedMethod = 'bank';
      } else if (method === 'cash') {
        mappedMethod = 'cash';
      }

      if (methodTotals.hasOwnProperty(mappedMethod)) {
        methodTotals[mappedMethod] += amount;
      } else {
        methodTotals.cash += amount; // default to cash if unknown
      }
      methodTotals.total += amount;
    });

    const total = methodTotals.total;

    const breakdown = [
      {
        method: 'cash',
        name: 'Cash',
        amount: methodTotals.cash,
        percentage: total > 0 ? (methodTotals.cash / total) * 100 : 0,
      },
      {
        method: 'airtel_money',
        name: 'Airtel Money',
        amount: methodTotals.airtel_money,
        percentage: total > 0 ? (methodTotals.airtel_money / total) * 100 : 0,
      },
      {
        method: 'mpamba',
        name: 'Mpamba',
        amount: methodTotals.mpamba,
        percentage: total > 0 ? (methodTotals.mpamba / total) * 100 : 0,
      },
      {
        method: 'bank',
        name: 'Bank',
        amount: methodTotals.bank,
        percentage: total > 0 ? (methodTotals.bank / total) * 100 : 0,
      },
    ].filter((item) => item.amount > 0);

    return {
      cash: methodTotals.cash,
      airtelMoney: methodTotals.airtel_money,
      mpamba: methodTotals.mpamba,
      bank: methodTotals.bank,
      total,
      breakdown,
    };
  }

  async getMonthlyReport(dateRangeDto?: DateRangeDto): Promise<any> {
    let startDate: Date;
    let endDate: Date;

    if (dateRangeDto?.startDate && dateRangeDto?.endDate) {
      startDate = new Date(dateRangeDto.startDate);
      endDate = new Date(dateRangeDto.endDate);
    } else {
      // Default to last 6 months
      endDate = new Date();
      startDate = subDays(endDate, 180);
    }

    const sales = await this.dailySalesRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    const monthlySummary: Record<string, any> = {};
    sales.forEach((s) => {
      const monthYear = format(s.date, 'yyyy-MM');
      if (!monthlySummary[monthYear]) {
        monthlySummary[monthYear] = {
          month: monthYear,
          totalSales: 0,
          totalCollected: 0,
          totalExpenses: 0,
          netRevenue: 0,
          billsAmount: 0,
          paymentsAmount: 0,
        };
      }
      monthlySummary[monthYear].totalSales += parseFloat(
        s.totalSales?.toString() || '0',
      );
      monthlySummary[monthYear].totalCollected += parseFloat(
        s.totalCollected?.toString() || '0',
      );
      monthlySummary[monthYear].totalExpenses += parseFloat(
        s.totalExpenses?.toString() || '0',
      );
      monthlySummary[monthYear].netRevenue += parseFloat(
        s.netRevenue?.toString() || '0',
      );
      monthlySummary[monthYear].billsAmount += parseFloat(
        s.billsAmount?.toString() || '0',
      );
    });

    return Object.values(monthlySummary);
  }

  async getOutstandingBalances(): Promise<OutstandingBalance[]> {
    const customers = await this.customerRepository.find({
      where: { status: CustomerStatus.APPROVED },
      relations: ['bills', 'payments'],
    });

    const balances: OutstandingBalance[] = customers
      .map((customer) => {
        const totalBills =
          customer.bills?.reduce(
            (sum, bill) => sum + parseFloat(bill.amount?.toString() || '0'),
            0,
          ) || 0;
        const totalPayments =
          customer.payments?.reduce(
            (sum, payment) =>
              sum + parseFloat(payment.amount?.toString() || '0'),
            0,
          ) || 0;
        const balance = totalBills - totalPayments;

        return {
          customerId: customer.id,
          customerName: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          totalBills,
          totalPayments,
          balance,
        };
      })
      .filter((b) => b.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    return balances;
  }

  async getTopCustomers(limit = 10): Promise<TopCustomer[]> {
    const customers = await this.customerRepository.find({
      relations: ['payments'],
      take: 100,
    });

    const topCustomers = customers
      .map((customer) => {
        const totalPaid =
          customer.payments?.reduce(
            (sum, payment) =>
              sum + parseFloat(payment.amount?.toString() || '0'),
            0,
          ) || 0;
        return {
          id: customer.id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          totalPaid,
        };
      })
      .filter((c) => c.totalPaid > 0)
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, limit);

    return topCustomers;
  }

  async getProductPerformance(
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // FIX: Add default date range if not provided
    let finalStartDate: Date;
    let finalEndDate: Date;

    if (startDate && endDate) {
      finalStartDate = new Date(startDate);
      finalEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      finalEndDate = new Date();
      finalStartDate = subDays(finalEndDate, 30);
    }

    const inventories = await this.dailyInventoryRepository.find({
      where: {
        dailySales: {
          date: Between(finalStartDate, finalEndDate),
        },
      },
      relations: ['product', 'product.category', 'dailySales'],
    });

    const productMap: Record<string, any> = {};

    inventories.forEach((inv) => {
      const productId = inv.product.id;
      if (!productMap[productId]) {
        productMap[productId] = {
          productId,
          productName: inv.product.name,
          categoryName: inv.product.category?.name || 'Uncategorized',
          totalSold: 0,
          totalRevenue: 0,
          count: 0,
        };
      }
      productMap[productId].totalSold += inv.soldQuantity || 0;
      productMap[productId].totalRevenue += parseFloat(
        inv.revenue?.toString() || '0',
      );
      productMap[productId].count++;
    });

    const topProducts = Object.values(productMap)
      .map((p: any) => ({
        ...p,
        averagePrice: p.totalSold > 0 ? p.totalRevenue / p.totalSold : 0,
      }))
      .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return { topProducts };
  }

  async getCategorySales(startDate?: string, endDate?: string): Promise<any> {
    // FIX: Add default date range if not provided
    let finalStartDate: Date;
    let finalEndDate: Date;

    if (startDate && endDate) {
      finalStartDate = new Date(startDate);
      finalEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      finalEndDate = new Date();
      finalStartDate = subDays(finalEndDate, 30);
    }

    const inventories = await this.dailyInventoryRepository.find({
      where: {
        dailySales: {
          date: Between(finalStartDate, finalEndDate),
        },
      },
      relations: ['product', 'product.category', 'dailySales'],
    });

    const categoryMap: Record<string, any> = {};

    inventories.forEach((inv) => {
      const categoryName = inv.product.category?.name || 'Uncategorized';
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          categoryName,
          totalRevenue: 0,
        };
      }
      categoryMap[categoryName].totalRevenue += parseFloat(
        inv.revenue?.toString() || '0',
      );
    });

    const total = Object.values(categoryMap).reduce(
      (sum: number, cat: any) => sum + cat.totalRevenue,
      0,
    );

    return Object.values(categoryMap).map((cat: any) => ({
      ...cat,
      percentage: total > 0 ? (cat.totalRevenue / total) * 100 : 0,
    }));
  }

  async getExpenseAnalysis(startDate?: string, endDate?: string): Promise<any> {
    // FIX: Add default date range if not provided
    let finalStartDate: Date;
    let finalEndDate: Date;

    if (startDate && endDate) {
      finalStartDate = new Date(startDate);
      finalEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      finalEndDate = new Date();
      finalStartDate = subDays(finalEndDate, 30);
    }

    // AFTER (with transaction_date column) - direct query
    const expenses = await this.dailyExpenseRepository
      .createQueryBuilder('de')
      .where('de.transaction_date BETWEEN :start AND :end', { 
        start: finalStartDate, 
        end: finalEndDate 
      })
      .getMany();

    const categoryMap: Record<string, number> = {};

    expenses.forEach((exp) => {
      const category = exp.category || 'other';
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += parseFloat(exp.amount?.toString() || '0');
    });

    return {
      byCategory: Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount,
      })),
    };
  }

  async getDailySalesPaymentMethods(
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // FIX: Add default date range if not provided
    let finalStartDate: Date;
    let finalEndDate: Date;

    if (startDate && endDate) {
      finalStartDate = new Date(startDate);
      finalEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      finalEndDate = new Date();
      finalStartDate = subDays(finalEndDate, 30);
    }

    const sales = await this.dailySalesRepository.find({
      where: {
        date: Between(finalStartDate, finalEndDate),
      },
    });

    let totalCash = 0;
    let totalAirtelMoney = 0;
    let totalMpamba = 0;
    let totalBank = 0;

    sales.forEach((s) => {
      totalCash += parseFloat(s.cash?.toString() || '0');
      totalAirtelMoney += parseFloat(s.airtelMoney?.toString() || '0');
      totalMpamba += parseFloat(s.mpamba?.toString() || '0');
      totalBank += parseFloat(s.bank?.toString() || '0');
    });

    const total = totalCash + totalAirtelMoney + totalMpamba + totalBank;

    return [
      {
        method: 'cash',
        name: 'Cash',
        amount: totalCash,
        percentage: total > 0 ? (totalCash / total) * 100 : 0,
      },
      {
        method: 'airtel_money',
        name: 'Airtel Money',
        amount: totalAirtelMoney,
        percentage: total > 0 ? (totalAirtelMoney / total) * 100 : 0,
      },
      {
        method: 'mpamba',
        name: 'Mpamba',
        amount: totalMpamba,
        percentage: total > 0 ? (totalMpamba / total) * 100 : 0,
      },
      {
        method: 'bank',
        name: 'Bank',
        amount: totalBank,
        percentage: total > 0 ? (totalBank / total) * 100 : 0,
      },
    ].filter((item) => item.amount > 0);
  }

  async getShortageTracking(
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // FIX: Add default date range if not provided
    let finalStartDate: Date;
    let finalEndDate: Date;

    if (startDate && endDate) {
      finalStartDate = new Date(startDate);
      finalEndDate = new Date(endDate);
    } else {
      // Default to last 30 days
      finalEndDate = new Date();
      finalStartDate = subDays(finalEndDate, 30);
    }

    const sales = await this.dailySalesRepository.find({
      where: {
        date: Between(finalStartDate, finalEndDate),
      },
      order: { date: 'ASC' },
    });

    const dailyShortage = sales.map((s) => ({
      date: format(s.date, 'yyyy-MM-dd'),
      shortage: parseFloat(s.shortage?.toString() || '0'),
      totalSales: parseFloat(s.totalSales?.toString() || '0'),
      totalCollected: parseFloat(s.totalCollected?.toString() || '0'),
      notes: s.notes,
    }));

    const totalShortage = sales.reduce(
      (sum, s) => sum + parseFloat(s.shortage?.toString() || '0'),
      0,
    );
    const daysWithShortage = sales.filter(
      (s) => parseFloat(s.shortage?.toString() || '0') > 0,
    ).length;

    return {
      dailyShortage,
      totalShortage,
      daysWithShortage,
      totalDays: sales.length,
      averageShortage: sales.length > 0 ? totalShortage / sales.length : 0,
    };
  }

  async getWeeklyComparison(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);

    const thisWeek = await this.dailySalesRepository.find({
      where: {
        date: MoreThanOrEqual(thisWeekStart),
      },
    });

    const lastWeek = await this.dailySalesRepository.find({
      where: {
        date: Between(lastWeekStart, lastWeekEnd),
      },
    });

    const calculateWeekStats = (sales: DailySales[]) => {
      return {
        totalSales: sales.reduce(
          (sum, s) => sum + parseFloat(s.totalSales?.toString() || '0'),
          0,
        ),
        totalExpenses: sales.reduce(
          (sum, s) => sum + parseFloat(s.totalExpenses?.toString() || '0'),
          0,
        ),
        netRevenue: sales.reduce(
          (sum, s) => sum + parseFloat(s.netRevenue?.toString() || '0'),
          0,
        ),
        days: sales.length,
      };
    };

    const thisWeekStats = calculateWeekStats(thisWeek);
    const lastWeekStats = calculateWeekStats(lastWeek);

    return {
      thisWeek: thisWeekStats,
      lastWeek: lastWeekStats,
      comparison: {
        salesChange:
          lastWeekStats.totalSales > 0
            ? ((thisWeekStats.totalSales - lastWeekStats.totalSales) /
                lastWeekStats.totalSales) *
              100
            : 0,
        expensesChange:
          lastWeekStats.totalExpenses > 0
            ? ((thisWeekStats.totalExpenses - lastWeekStats.totalExpenses) /
                lastWeekStats.totalExpenses) *
              100
            : 0,
        revenueChange:
          lastWeekStats.netRevenue > 0
            ? ((thisWeekStats.netRevenue - lastWeekStats.netRevenue) /
                lastWeekStats.netRevenue) *
              100
            : 0,
      },
    };
  }

  /**
   * Daily sales summary for a date range (used by Reports controller)
   * This now includes stock purchases (separate from other expenses) and subtracts them from netRevenue.
   */
  async getDailySalesSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<any> {
    // Parse dates consistently
    const now = new Date();
    const defaultEnd = endOfDay(now);
    const defaultStart = startOfDay(
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    ); // last 30 days

    const parsedStart = startDate
      ? startOfDay(parseISO(startDate))
      : defaultStart;
    const parsedEnd = endDate ? endOfDay(parseISO(endDate)) : defaultEnd;

    const start = parsedStart;
    const end = parsedEnd;

    // OPTIMIZATION 1: Fetch daily sales WITHOUT relations first (faster query)
    const dailySalesRecords = await this.dailySalesRepository.find({
      where: {
        date: Between(start, end),
      },
      order: {
        date: 'ASC',
      },
    });

    // Early return if no data - avoid unnecessary queries
    if (dailySalesRecords.length === 0) {
      return {
        summary: {
          totalSales: 0,
          totalCollected: 0,
          totalExpenses: 0,
          totalStockPurchases: 0,
          totalNetRevenue: 0,
          days: 0,
        },
        dailyBreakdown: [],
      };
    }

    // Extract daily sales IDs for batched queries
    const dailySalesIds = dailySalesRecords.map((ds) => ds.id);

    // ✅ FIX: Query stock purchases by transaction_date (direct query - faster)
    const stockPurchases = await this.stockPurchaseRepository
      .createQueryBuilder('sp')
      .where('sp.transaction_date BETWEEN :start AND :end', { start, end })
      .getMany();

    // Build map of stock purchases by daily_sales_id for backward compatibility
    const stockByDailySalesId = new Map<string, number>();
    const stockByDate = new Map<string, number>(); // For grouping by date
    
    stockPurchases.forEach((sp) => {
      const dateKey = format(sp.transactionDate, 'yyyy-MM-dd');
      const currentStock = stockByDate.get(dateKey) || 0;
      stockByDate.set(dateKey, currentStock + (parseFloat((sp.totalCost || 0).toString()) || 0));
      
      // Also maintain backward compatibility with daily_sales_id mapping
      if (sp.dailySalesId) {
        const current = stockByDailySalesId.get(sp.dailySalesId) || 0;
        stockByDailySalesId.set(
          sp.dailySalesId,
          current + (parseFloat((sp.totalCost || 0).toString()) || 0),
        );
      }
    });

    // Calculate totals
    const totalSales = dailySalesRecords.reduce(
      (sum, s) => sum + (parseFloat((s.totalSales || 0).toString()) || 0),
      0,
    );

    const totalExpenses = dailySalesRecords.reduce(
      (sum, s) => sum + (parseFloat((s.totalExpenses || 0).toString()) || 0),
      0,
    );

    const totalCollected = dailySalesRecords.reduce(
      (sum, s) => sum + (parseFloat((s.totalCollected || 0).toString()) || 0),
      0,
    );

    // Calculate total stock purchases from the stockByDate map (direct date query result)
    const totalStockPurchases = Array.from(stockByDate.values()).reduce(
      (sum, val) => sum + val,
      0,
    );

    const totalNetRevenue = totalSales - totalExpenses - totalStockPurchases;

    // Build daily breakdown
    const dailyBreakdown = dailySalesRecords.map((ds) => {
      const dateStr = format(ds.date, 'yyyy-MM-dd');
      const stockTotalForDay = stockByDate.get(dateStr) || 0;

      const dsTotalSales = parseFloat((ds.totalSales || 0).toString()) || 0;
      const dsTotalExpenses =
        parseFloat((ds.totalExpenses || 0).toString()) || 0;
      const dsTotalCollected =
        parseFloat((ds.totalCollected || 0).toString()) || 0;
      const dsBills = parseFloat((ds.billsAmount || 0).toString()) || 0;

      return {
        date: dateStr,
        totalSales: dsTotalSales,
        billsAmount: dsBills,
        totalPayments: dsTotalCollected,
        totalExpenses: dsTotalExpenses,
        stockPurchasesAmount: stockTotalForDay,
        netRevenue: dsTotalSales - dsTotalExpenses - stockTotalForDay,
      };
    });

    return {
      summary: {
        totalSales,
        totalCollected,
        totalExpenses,
        totalStockPurchases,
        totalNetRevenue,
        days: dailyBreakdown.length,
      },
      dailyBreakdown,
    };
  }
}