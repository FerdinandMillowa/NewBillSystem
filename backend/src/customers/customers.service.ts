import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

    const existingCustomer = await this.customerRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Customer with this email or phone already exists',
      );
    }

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
    const { search, status, page = 1, limit = 10, withBalance } = queryDto;
    const skip = (page - 1) * limit;

    if (withBalance) {
      // FIX: The previous implementation used two simultaneous LEFT JOINs
      // (bills + payments) which produced a Cartesian product. A customer
      // with N bills and M payments would generate N*M joined rows, causing
      // SUM(bill.amount) to be multiplied by M and SUM(payment.amount) to
      // be multiplied by N. This made the HAVING clause produce completely
      // wrong balance values, silently excluding customers with real balances.
      //
      // Fix: use correlated subqueries — each runs independently against its
      // own table with no cross-join, so SUM() always sees the correct rows.
      let qb = this.customerRepository
        .createQueryBuilder('customer')
        .select('customer.id', 'id')
        .addSelect('customer.first_name', 'firstName')
        .addSelect('customer.last_name', 'lastName')
        .addSelect('customer.email', 'email')
        .addSelect('customer.phone', 'phone')
        .addSelect('customer.address', 'address')
        .addSelect('customer.status', 'status')
        .addSelect('customer.created_at', 'createdAt')
        .addSelect('customer.updated_at', 'updatedAt')
        // Correlated subquery for total bills — no join, no Cartesian product
        .addSelect(
          '(SELECT COALESCE(SUM(b.amount), 0) FROM bills b WHERE b.customer_id = customer.id)',
          'totalBills',
        )
        // Correlated subquery for total payments — independent of bills
        .addSelect(
          '(SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.customer_id = customer.id)',
          'totalPayments',
        )
        .having(
          '(SELECT COALESCE(SUM(b.amount), 0) FROM bills b WHERE b.customer_id = customer.id) - (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.customer_id = customer.id) > 0',
        )
        .groupBy('customer.id')
        .orderBy('customer.created_at', 'DESC');

      if (search) {
        qb = qb.where(
          '(customer.first_name ILIKE :search OR customer.last_name ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
          { search: `%${search}%` },
        );
      }

      // Get total count — run without pagination
      const allRows = await qb.getRawMany();
      const total = allRows.length;

      // Get paged results
      const pagedRows = await qb.limit(limit).offset(skip).getRawMany();

      const customers: Customer[] = pagedRows.map((row) => {
        const totalBills = parseFloat(row.totalBills || '0');
        const totalPayments = parseFloat(row.totalPayments || '0');
        const balance = totalBills - totalPayments;

        const c = Object.assign(new Customer(), {
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          address: row.address,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        });

        (c as any).balance = balance;
        return c;
      });

      return { customers, total, page, limit };
    }

    // Standard query — no balance filter
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    if (search) {
      queryBuilder.where(
        '(customer.firstName ILIKE :search OR customer.lastName ILIKE :search OR customer.email ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('customer.createdAt', 'DESC');

    const [customers, total] = await queryBuilder.getManyAndCount();

    return { customers, total, page, limit };
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

    const totalBills = await this.billRepository
      .createQueryBuilder('bill')
      .select('SUM(bill.amount)', 'total')
      .where('bill.customerId = :customerId', { customerId: id })
      .getRawOne();

    const totalPayments = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.customerId = :customerId', { customerId: id })
      .getRawOne();

    const bills = parseFloat(totalBills?.total || '0');
    const payments = parseFloat(totalPayments?.total || '0');
    const balance = bills - payments;

    return { ...customer, balance };
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

    // FIX: Also use correlated subqueries here for the same reason —
    // the stats count must match what the list actually returns.
    const customersWithBalances = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.id', 'id')
      .having(
        '(SELECT COALESCE(SUM(b.amount), 0) FROM bills b WHERE b.customer_id = customer.id) - (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.customer_id = customer.id) > 0',
      )
      .groupBy('customer.id')
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
