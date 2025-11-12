import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { CustomerStatus } from '../common/enums';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const { email, phone } = createCustomerDto;

    // Check if customer already exists
    const existingCustomer = await this.customerRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Customer with this email or phone already exists',
      );
    }

    // Create customer with pending status
    const customer = this.customerRepository.create({
      ...createCustomerDto,
      status: CustomerStatus.PENDING,
    });

    return this.customerRepository.save(customer);
  }

  async findAll(queryDto: QueryCustomersDto): Promise<{
    customers: Customer[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { search, status, page = 1, limit = 10 } = queryDto;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // Search by name, email, or phone
    if (search) {
      queryBuilder.where(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Order by creation date
    queryBuilder.orderBy('customer.createdAt', 'DESC');

    const [customers, total] = await queryBuilder.getManyAndCount();

    return {
      customers,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['bills', 'payments'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async findOneWithBalance(
    id: string,
  ): Promise<Customer & { balance: number }> {
    const customer = await this.findOne(id);

    // Calculate total bills
    const totalBills = await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .where('bill.customerId = :customerId', { customerId: id })
      .getRawOne();

    // Calculate total payments
    const totalPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.customerId = :customerId', { customerId: id })
      .getRawOne();

    const bills = parseFloat(totalBills?.total || '0');
    const payments = parseFloat(totalPayments?.total || '0');
    const balance = bills - payments;

    return {
      ...customer,
      balance,
    };
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if email or phone is being changed and already exists
    if (updateCustomerDto.email || updateCustomerDto.phone) {
      const existingCustomer = await this.customerRepository.findOne({
        where: [
          { email: updateCustomerDto.email },
          { phone: updateCustomerDto.phone },
        ],
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException(
          'Customer with this email or phone already exists',
        );
      }
    }

    // Update customer
    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async approveCustomer(id: string, status: CustomerStatus): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (customer.status === status) {
      throw new BadRequestException(`Customer is already ${status}`);
    }

    customer.status = status;
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<{ message: string }> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['bills', 'payments'],
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if customer has bills or payments
    if (customer.bills.length > 0 || customer.payments.length > 0) {
      throw new BadRequestException(
        'Cannot delete customer with existing bills or payments. Delete those records first.',
      );
    }

    await this.customerRepository.remove(customer);

    return { message: 'Customer deleted successfully' };
  }

  async getCustomerStats(): Promise<any> {
    const totalCustomers = await this.customerRepository.count();
    const approvedCustomers = await this.customerRepository.count({
      where: { status: CustomerStatus.APPROVED },
    });
    const pendingCustomers = await this.customerRepository.count({
      where: { status: CustomerStatus.PENDING },
    });

    // Get customers with outstanding balances
    const customersWithBalances = await this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.bills', 'bill')
      .leftJoin('customer.payments', 'payment')
      .select('customer.id', 'id')
      .addSelect('COALESCE(SUM(bill.amount), 0)', 'totalBills')
      .addSelect('COALESCE(SUM(payment.amount), 0)', 'totalPayments')
      .groupBy('customer.id')
      .having(
        'COALESCE(SUM(bill.amount), 0) - COALESCE(SUM(payment.amount), 0) > 0',
      )
      .getRawMany();

    return {
      total: totalCustomers,
      approved: approvedCustomers,
      pending: pendingCustomers,
      withOutstandingBalance: customersWithBalances.length,
    };
  }

  async getPendingApprovals(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { status: CustomerStatus.PENDING },
      order: { createdAt: 'ASC' },
    });
  }
}
