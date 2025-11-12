import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';
import { DateRangeDto } from './dto/date-range.dto';
import {
  DailySummary,
  MonthlySummary,
  OutstandingBalance,
  PaymentMethodDistribution,
  RevenueReport,
  DashboardStats,
} from './interfaces/report-response.interface';
import { CustomerStatus } from '../common/enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // Customer stats
    const totalCustomers = await this.customerRepository.count();
    const approvedCustomers = await this.customerRepository.count({
      where: { status: CustomerStatus.APPROVED },
    });
    const pendingCustomers = await this.customerRepository.count({
      where: { status: CustomerStatus.PENDING },
    });

    // Bills stats
    const totalBills = await this.billRepository.count();
    const billsAmount = await this.billRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.amount), 0)', 'total')
      .getRawOne();

    // Payments stats
    const totalPayments = await this.paymentRepository.count();
    const paymentsAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .getRawOne();

    const bills = parseFloat(billsAmount?.total || '0');
    const payments = parseFloat(paymentsAmount?.total || '0');
    const outstanding = bills - payments;
    const collectionRate = bills > 0 ? (payments / bills) * 100 : 0;

    return {
      customers: {
        total: totalCustomers,
        approved: approvedCustomers,
        pending: pendingCustomers,
      },
      bills: {
        total: totalBills,
        amount: bills,
      },
      payments: {
        total: totalPayments,
        amount: payments,
      },
      revenue: {
        outstanding,
        collected: payments,
        collectionRate: parseFloat(collectionRate.toFixed(2)),
      },
    };
  }

  async getDailyReport(dateRangeDto: DateRangeDto): Promise<DailySummary[]> {
    const { startDate, endDate } = dateRangeDto;

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get bills by day
    const billsByDay = await this.billRepository
      .createQueryBuilder('bill')
      .select("TO_CHAR(bill.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(bill.amount), 0)', 'amount')
      .where('bill.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("TO_CHAR(bill.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(bill.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    // Get payments by day
    const paymentsByDay = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .where('payment.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(payment.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    // Merge bills and payments by date
    const dateMap = new Map<string, DailySummary>();

    billsByDay.forEach((bill) => {
      dateMap.set(bill.date, {
        date: bill.date,
        totalBills: parseInt(bill.count),
        billsAmount: parseFloat(bill.amount),
        totalPayments: 0,
        paymentsAmount: 0,
        netRevenue: 0,
      });
    });

    paymentsByDay.forEach((payment) => {
      const existing = dateMap.get(payment.date) || {
        date: payment.date,
        totalBills: 0,
        billsAmount: 0,
        totalPayments: 0,
        paymentsAmount: 0,
        netRevenue: 0,
      };

      existing.totalPayments = parseInt(payment.count);
      existing.paymentsAmount = parseFloat(payment.amount);
      dateMap.set(payment.date, existing);
    });

    // Calculate net revenue
    const result: DailySummary[] = Array.from(dateMap.values()).map((item) => ({
      ...item,
      netRevenue: item.paymentsAmount - item.billsAmount,
    }));

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getMonthlyReport(
    dateRangeDto: DateRangeDto,
  ): Promise<MonthlySummary[]> {
    const { startDate, endDate } = dateRangeDto;

    // Default to last 12 months if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get bills by month
    const billsByMonth = await this.billRepository
      .createQueryBuilder('bill')
      .select("TO_CHAR(bill.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(bill.amount), 0)', 'amount')
      .where('bill.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("TO_CHAR(bill.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(bill.createdAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    // Get payments by month
    const paymentsByMonth = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .where('payment.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy("TO_CHAR(payment.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(payment.createdAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    // Merge bills and payments by month
    const monthMap = new Map<string, MonthlySummary>();

    billsByMonth.forEach((bill) => {
      monthMap.set(bill.month, {
        month: bill.month,
        totalBills: parseInt(bill.count),
        billsAmount: parseFloat(bill.amount),
        totalPayments: 0,
        paymentsAmount: 0,
        netRevenue: 0,
      });
    });

    paymentsByMonth.forEach((payment) => {
      const existing = monthMap.get(payment.month) || {
        month: payment.month,
        totalBills: 0,
        billsAmount: 0,
        totalPayments: 0,
        paymentsAmount: 0,
        netRevenue: 0,
      };

      existing.totalPayments = parseInt(payment.count);
      existing.paymentsAmount = parseFloat(payment.amount);
      monthMap.set(payment.month, existing);
    });

    // Calculate net revenue
    const result: MonthlySummary[] = Array.from(monthMap.values()).map(
      (item) => ({
        ...item,
        netRevenue: item.paymentsAmount - item.billsAmount,
      }),
    );

    return result.sort((a, b) => a.month.localeCompare(b.month));
  }

  async getOutstandingBalances(): Promise<OutstandingBalance[]> {
    const result = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.bills', 'bill')
      .leftJoin('customer.payments', 'payment')
      .select('customer.id', 'customerId')
      .addSelect(
        "customer.firstName || ' ' || customer.lastName",
        'customerName',
      )
      .addSelect('customer.email', 'email')
      .addSelect('customer.phone', 'phone')
      .addSelect('COALESCE(SUM(bill.amount), 0)', 'totalBills')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalPayments')
      .where('customer.status = :status', { status: CustomerStatus.APPROVED })
      .groupBy('customer.id')
      .having(
        'COALESCE(SUM(bill.amount), 0) - COALESCE(SUM(payment.amount), 0) > 0',
      )
      .orderBy(
        'COALESCE(SUM(bill.amount), 0) - COALESCE(SUM(payment.amount), 0)',
        'DESC',
      )
      .getRawMany();

    return result.map((item) => ({
      customerId: item.customerId,
      customerName: item.customerName,
      email: item.email,
      phone: item.phone,
      totalBills: parseFloat(item.totalBills),
      totalPayments: parseFloat(item.totalPayments),
      balance: parseFloat(item.totalBills) - parseFloat(item.totalPayments),
    }));
  }

  async getPaymentMethodDistribution(): Promise<PaymentMethodDistribution[]> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .groupBy('payment.paymentMethod')
      .getRawMany();

    const total = result.reduce(
      (sum, item) => sum + parseFloat(item.amount),
      0,
    );

    return result.map((item) => ({
      method: item.method,
      count: parseInt(item.count),
      amount: parseFloat(item.amount),
      percentage:
        total > 0
          ? parseFloat(((parseFloat(item.amount) / total) * 100).toFixed(2))
          : 0,
    }));
  }

  async getRevenueReport(dateRangeDto: DateRangeDto): Promise<RevenueReport> {
    const { startDate, endDate } = dateRangeDto;

    let whereCondition = {};
    let period = 'All Time';

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      whereCondition = { createdAt: Between(start, end) };
      period = `${startDate} to ${endDate}`;
    } else if (startDate) {
      const start = new Date(startDate);
      whereCondition = { createdAt: MoreThanOrEqual(start) };
      period = `From ${startDate}`;
    } else if (endDate) {
      const end = new Date(endDate);
      whereCondition = { createdAt: LessThanOrEqual(end) };
      period = `Until ${endDate}`;
    }

    // Get bills
    const billsData = await this.billRepository
      .createQueryBuilder('bill')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(bill.amount), 0)', 'amount')
      .where(whereCondition)
      .getRawOne();

    // Get payments
    const paymentsData = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'amount')
      .where(whereCondition)
      .getRawOne();

    const billsAmount = parseFloat(billsData?.amount || '0');
    const paymentsAmount = parseFloat(paymentsData?.amount || '0');
    const outstanding = billsAmount - paymentsAmount;
    const collectionRate =
      billsAmount > 0 ? (paymentsAmount / billsAmount) * 100 : 0;

    return {
      period,
      totalBills: parseInt(billsData?.count || '0'),
      billsAmount,
      totalPayments: parseInt(paymentsData?.count || '0'),
      paymentsAmount,
      outstandingAmount: outstanding,
      collectionRate: parseFloat(collectionRate.toFixed(2)),
    };
  }

  async getTopCustomers(limit: number = 10): Promise<any[]> {
    const result = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.payments', 'payment')
      .select('customer.id', 'id')
      .addSelect("customer.firstName || ' ' || customer.lastName", 'name')
      .addSelect('customer.email', 'email')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalPaid')
      .where('customer.status = :status', { status: CustomerStatus.APPROVED })
      .groupBy('customer.id')
      .orderBy('COALESCE(SUM(payment.amount), 0)', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      totalPaid: parseFloat(item.totalPaid),
    }));
  }
}
