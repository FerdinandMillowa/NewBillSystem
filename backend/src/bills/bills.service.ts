import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../database/entities/bill.entity';
import { Customer } from '../database/entities/customer.entity';
import { Payment } from '../database/entities/payment.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { QueryBillsDto } from './dto/query-bills.dto';
import { CustomerStatus } from '../common/enums';
import { DailySales } from '../database/entities/daily-sales.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(DailySales)
    private dailySalesRepository: Repository<DailySales>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createBillDto: CreateBillDto): Promise<Bill> {
    const { customerId, dailySalesId, amount, description, transactionDate } =
      createBillDto;

    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status !== CustomerStatus.APPROVED) {
      throw new BadRequestException(
        'Customer must be approved before creating bills',
      );
    }

    // Determine business date
    let businessDate = transactionDate ? new Date(transactionDate) : new Date();

    // If linked to daily sales, use that date
    if (dailySalesId && !transactionDate) {
      const dailySales = await this.dailySalesRepository.findOne({
        where: { id: dailySalesId },
      });
      if (dailySales) {
        businessDate = dailySales.date;
      }
    }

    const bill = this.billRepository.create({
      customerId,
      amount,
      description,
      dailySalesId: dailySalesId || null,
      transactionDate: businessDate,
    });

    const savedBill = await this.billRepository.save(bill);

    // Calculate outstanding balance for the notification
    // Done after save so this bill is included in the total
    const totalBillsResult = await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .where('bill.customerId = :customerId', { customerId })
      .getRawOne();

    const totalPaymentsResult = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.customerId = :customerId', { customerId })
      .getRawOne();

    const totalBills = parseFloat(totalBillsResult?.total || '0');
    const totalPayments = parseFloat(totalPaymentsResult?.total || '0');
    const outstandingBalance = totalBills - totalPayments;

    // Fire email notification — non-blocking, silent failure
    this.notificationsService.sendBillNotification({
      customerFirstName: customer.firstName,
      customerLastName: customer.lastName,
      customerEmail: customer.email,
      billId: savedBill.id,
      amount: parseFloat(amount.toString()),
      description,
      transactionDate: businessDate,
      outstandingBalance,
      createdAt: savedBill.createdAt,
    });

    return savedBill;
  }

  async findAll(queryDto: QueryBillsDto): Promise<{
    bills: Bill[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { customerId, search, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer');

    if (customerId) {
      queryBuilder.where('bill.customerId = :customerId', { customerId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(bill.description ILIKE :search OR customer.firstName ILIKE :search OR customer.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('bill.createdAt', 'DESC');

    const [bills, total] = await queryBuilder.getManyAndCount();

    return {
      bills,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { id },
      relations: ['customer', 'dailySales'],
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    return bill;
  }

  async findByCustomer(customerId: string): Promise<Bill[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.billRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
      relations: ['dailySales'],
    });
  }

  async update(id: string, updateBillDto: UpdateBillDto): Promise<Bill> {
    const bill = await this.billRepository.findOne({
      where: { id },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    Object.assign(bill, updateBillDto);
    return this.billRepository.save(bill);
  }

  async remove(id: string): Promise<{ message: string }> {
    const bill = await this.billRepository.findOne({
      where: { id },
    });

    if (!bill) {
      throw new NotFoundException('Bill not found');
    }

    await this.billRepository.remove(bill);
    return { message: 'Bill deleted successfully' };
  }

  async getTotalBillsByCustomer(customerId: string): Promise<number> {
    const result = await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .where('bill.customerId = :customerId', { customerId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }

  async getBillStats(): Promise<any> {
    const totalBills = await this.billRepository.count();

    const totalAmount = await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .getRawOne();

    const averageAmount = await this.billRepository
      .createQueryBuilder('bill')
      .select('AVG(bill.amount)', 'average')
      .getRawOne();

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const billsByMonth = await this.billRepository
      .createQueryBuilder('bill')
      .select("TO_CHAR(bill.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(bill.amount)', 'total')
      .where('bill.createdAt >= :date', { date: sixMonthsAgo })
      .groupBy("TO_CHAR(bill.createdAt, 'YYYY-MM')")
      .orderBy("TO_CHAR(bill.createdAt, 'YYYY-MM')", 'ASC')
      .getRawMany();

    return {
      totalBills,
      totalAmount: parseFloat(totalAmount?.total || '0'),
      averageAmount: parseFloat(averageAmount?.average || '0'),
      billsByMonth: billsByMonth.map((item) => ({
        month: item.month,
        count: parseInt(item.count),
        total: parseFloat(item.total),
      })),
    };
  }

  async getRecentBills(limit: number = 10): Promise<Bill[]> {
    return this.billRepository.find({
      relations: ['customer', 'dailySales'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
