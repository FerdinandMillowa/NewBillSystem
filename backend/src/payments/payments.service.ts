import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../database/entities/payment.entity';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { CustomerStatus, PaymentMethod } from '../common/enums';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { customerId, amount, paymentMethod, notes, paymentDate } =
      createPaymentDto;

    // Verify customer exists and is approved
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status !== CustomerStatus.APPROVED) {
      throw new BadRequestException(
        'Customer must be approved before recording payments',
      );
    }

    // Calculate customer's outstanding balance
    const totalBills = await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .where('bill.customerId = :customerId', { customerId })
      .getRawOne();

    const totalPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.customerId = :customerId', { customerId })
      .getRawOne();

    const bills = parseFloat(totalBills?.total || '0');
    const payments = parseFloat(totalPayments?.total || '0');
    const outstandingBalance = bills - payments;

    // Warn if payment exceeds outstanding balance
    if (amount > outstandingBalance) {
      // You can choose to throw an error or allow overpayment
      // For now, we'll allow it but you can uncomment the line below to prevent it
      // throw new BadRequestException(`Payment amount (${amount}) exceeds outstanding balance (${outstandingBalance})`);
    }

    // Create payment
    const payment = this.paymentRepository.create({
      customerId,
      amount,
      paymentMethod,
      notes,
      ...(paymentDate && { paymentDate: new Date(paymentDate) }),
    });

    return this.paymentRepository.save(payment);
  }

  async findAll(queryDto: QueryPaymentsDto): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      customerId,
      paymentMethod,
      search,
      page = 1,
      limit = 10,
    } = queryDto;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.customer', 'customer');

    // Filter by customer
    if (customerId) {
      queryBuilder.where('payment.customerId = :customerId', { customerId });
    }

    // Filter by payment method
    if (paymentMethod) {
      queryBuilder.andWhere('payment.paymentMethod = :paymentMethod', {
        paymentMethod,
      });
    }

    // Search by notes or customer name
    if (search) {
      queryBuilder.andWhere(
        '(payment.notes ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date (newest first)
    queryBuilder.orderBy('payment.createdAt', 'DESC');

    const [payments, total] = await queryBuilder.getManyAndCount();

    return {
      payments,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async findByCustomer(customerId: string): Promise<Payment[]> {
    // Verify customer exists
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.paymentRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<{ message: string }> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.paymentRepository.remove(payment);

    return { message: 'Payment deleted successfully' };
  }

  async getTotalPaymentsByCustomer(customerId: string): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.customerId = :customerId', { customerId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  async getPaymentStats(): Promise<any> {
    const totalPayments = await this.paymentRepository.count();

    const totalAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    const averageAmount = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('AVG(payment.amount)', 'average')
      .getRawOne();

    // Get payments by method
    const paymentsByMethod = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.paymentMethod', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'total')
      .groupBy('payment.paymentMethod')
      .getRawMany();

    // Get payments by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const paymentsByMonth = await this.paymentRepository
      .createQueryBuilder('payment')
      .select("TO_CHAR(payment.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.createdAt >= :date', { date: sixMonthsAgo })
      .groupBy("TO_CHAR(payment.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(payment.createdAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return {
      totalPayments,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      averageAmount: parseFloat(averageAmount?.average || '0'),
      paymentsByMethod: paymentsByMethod.map((item) => ({
        method: item.method,
        count: parseInt(item.count),
        total: parseFloat(item.total),
      })),
      paymentsByMonth: paymentsByMonth.map((item) => ({
        month: item.month,
        count: parseInt(item.count),
        total: parseFloat(item.total),
      })),
    };
  }

  async getRecentPayments(limit: number = 10): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['customer'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
