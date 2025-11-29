import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { DailySales } from '../database/entities/daily-sales.entity';
import { DailyInventory } from '../database/entities/daily-inventory.entity';
import { DailyExpense } from '../database/entities/daily-expense.entity';
import { StockPurchase } from '../database/entities/stock-purchase.entity';
import { InventoryTransfer } from '../database/entities/inventory-transfer.entity';
import { Product } from '../database/entities/product.entity';
import { Bill } from '../database/entities/bill.entity';
import { CreateDailySalesDto } from './dto/create-daily-sales.dto';
import { UpdateDailySalesDto } from './dto/update-daily-sales.dto';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
import { QueryDailySalesDto } from './dto/query-daily-sales.dto';

@Injectable()
export class DailySalesService {
  constructor(
    @InjectRepository(DailySales)
    private dailySalesRepository: Repository<DailySales>,
    @InjectRepository(DailyInventory)
    private dailyInventoryRepository: Repository<DailyInventory>,
    @InjectRepository(DailyExpense)
    private dailyExpenseRepository: Repository<DailyExpense>,
    @InjectRepository(StockPurchase)
    private stockPurchaseRepository: Repository<StockPurchase>,
    @InjectRepository(InventoryTransfer)
    private inventoryTransferRepository: Repository<InventoryTransfer>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
  ) {}

  async create(createDailySalesDto: CreateDailySalesDto): Promise<DailySales> {
    const { date, inventories, expenses, stockPurchases, ...salesData } =
      createDailySalesDto;

    // Check if daily sales already exists for this date
    const existingSales = await this.dailySalesRepository.findOne({
      where: { date: new Date(date) },
    });

    if (existingSales) {
      throw new ConflictException(
        'Daily sales record already exists for this date',
      );
    }

    // Calculate total collected
    const totalCollected =
      (salesData.cash || 0) +
      (salesData.airtelMoney || 0) +
      (salesData.mpamba || 0) +
      (salesData.bank || 0);

    // Process inventory items and calculate total sales
    let totalSales = 0;
    const inventoryRecords: DailyInventory[] = [];

    for (const invItem of inventories) {
      const product = await this.productRepository.findOne({
        where: { id: invItem.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${invItem.productId} not found`);
      }

      // Calculate sold quantity
      const soldQuantity =
        invItem.openingStock + invItem.stockIn - invItem.closingStock;

      if (soldQuantity < 0) {
        throw new BadRequestException(
          `Invalid inventory calculation for ${product.name}. Sold quantity cannot be negative.`,
        );
      }

      const revenue = soldQuantity * product.currentPrice;
      totalSales += revenue;

      inventoryRecords.push(
        this.dailyInventoryRepository.create({
          productId: invItem.productId,
          openingStock: invItem.openingStock,
          stockIn: invItem.stockIn,
          closingStock: invItem.closingStock,
          soldQuantity,
          productPrice: product.currentPrice,
          revenue,
        }),
      );

      // Update product current stock to closing stock
      product.currentStock = invItem.closingStock;
      await this.productRepository.save(product);
    }

    // Process expenses and calculate totals
    let totalExpenses = 0;
    let cashExpenses = 0;
    const expenseRecords: DailyExpense[] = [];

    if (expenses && expenses.length > 0) {
      for (const expItem of expenses) {
        const paymentMethod = expItem.paymentMethod || 'cash';
        totalExpenses += expItem.amount;

        if (paymentMethod === 'cash') {
          cashExpenses += expItem.amount;
        }

        expenseRecords.push(
          this.dailyExpenseRepository.create({
            category: expItem.category as any,
            description: expItem.description,
            amount: expItem.amount,
            paymentMethod: paymentMethod as any,
          }),
        );
      }
    }

    // Process stock purchases
    let totalStockPurchases = 0;
    const stockPurchaseRecords: StockPurchase[] = [];

    if (stockPurchases && stockPurchases.length > 0) {
      for (const purchaseItem of stockPurchases) {
        const product = await this.productRepository.findOne({
          where: { id: purchaseItem.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Product ${purchaseItem.productId} not found`,
          );
        }

        const totalCost = purchaseItem.quantity * purchaseItem.unitCost;
        totalStockPurchases += totalCost;

        stockPurchaseRecords.push(
          this.stockPurchaseRepository.create({
            productId: purchaseItem.productId,
            quantity: purchaseItem.quantity,
            unitCost: purchaseItem.unitCost,
            totalCost,
            paymentMethod: purchaseItem.paymentMethod as any,
            supplier: purchaseItem.supplier,
            notes: purchaseItem.notes,
          }),
        );

        // Update product stock (purchases increase stock)
        product.currentStock += purchaseItem.quantity;
        await this.productRepository.save(product);
      }
    }

    // Calculate shortage and net values
    const shortage = totalSales - totalCollected;
    const netRevenue = totalSales - totalExpenses;
    const cashAtHand = (salesData.cash || 0) - cashExpenses;

    // Create daily sales record
    const dailySales = this.dailySalesRepository.create({
      date: new Date(date),
      cash: salesData.cash || 0,
      airtelMoney: salesData.airtelMoney || 0,
      mpamba: salesData.mpamba || 0,
      bank: salesData.bank || 0,
      totalCollected,
      totalSales,
      billsAmount: salesData.billsAmount || 0,
      shortage: shortage > 0 ? shortage : 0,
      totalExpenses,
      cashExpenses,
      netRevenue,
      cashAtHand,
      totalStockPurchases,
      notes: salesData.notes,
      status: 'draft',
    });

    const savedSales = await this.dailySalesRepository.save(dailySales);

    // Save related records
    if (inventoryRecords.length > 0) {
      for (const inv of inventoryRecords) {
        inv.dailySalesId = savedSales.id;
      }
      await this.dailyInventoryRepository.save(inventoryRecords);
    }

    if (expenseRecords.length > 0) {
      for (const exp of expenseRecords) {
        exp.dailySalesId = savedSales.id;
      }
      await this.dailyExpenseRepository.save(expenseRecords);
    }

    if (stockPurchaseRecords.length > 0) {
      for (const purchase of stockPurchaseRecords) {
        purchase.dailySalesId = savedSales.id;
      }
      await this.stockPurchaseRepository.save(stockPurchaseRecords);
    }

    return this.findOne(savedSales.id);
  }

  async findAll(queryDto: QueryDailySalesDto): Promise<{
    sales: DailySales[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { startDate, endDate, page = 1, limit = 30 } = queryDto;

    const queryBuilder = this.dailySalesRepository
      .createQueryBuilder('dailySales')
      .orderBy('dailySales.date', 'DESC');

    // Date range filter
    if (startDate && endDate) {
      queryBuilder.where('dailySales.date BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.where('dailySales.date >= :startDate', {
        startDate: new Date(startDate),
      });
    } else if (endDate) {
      queryBuilder.where('dailySales.date <= :endDate', {
        endDate: new Date(endDate),
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [sales, total] = await queryBuilder.getManyAndCount();

    return {
      sales,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
      relations: [
        'inventories',
        'inventories.product',
        'expenses',
        'stockPurchases',
        'stockPurchases.product',
        'inventoryTransfers',
      ],
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    return dailySales;
  }

  async findByDate(date: string): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { date: new Date(date) },
      relations: [
        'inventories',
        'inventories.product',
        'expenses',
        'stockPurchases',
        'inventoryTransfers',
      ],
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found for this date');
    }

    return dailySales;
  }

  async getToday(): Promise<DailySales | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.dailySalesRepository.findOne({
      where: { date: today },
      relations: [
        'inventories',
        'inventories.product',
        'expenses',
        'stockPurchases',
      ],
    });
  }

  async update(
    id: string,
    updateDailySalesDto: UpdateDailySalesDto,
  ): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status === 'finalized') {
      throw new BadRequestException(
        'Cannot update finalized daily sales record. Contact admin to unlock.',
      );
    }

    // Update will be similar to create but with existing record
    // For simplicity, you might want to delete and recreate related records
    // Or implement more granular updates

    return this.findOne(id);
  }

  async finalize(id: string): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status === 'finalized') {
      throw new BadRequestException('Daily sales record is already finalized');
    }

    dailySales.status = 'finalized';
    dailySales.finalizedAt = new Date();

    return this.dailySalesRepository.save(dailySales);
  }

  async unlock(id: string): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    dailySales.status = 'draft';
    dailySales.finalizedAt = null;

    return this.dailySalesRepository.save(dailySales);
  }

  async createInventoryTransfer(
    dailySalesId: string,
    createTransferDto: CreateInventoryTransferDto,
    userId: string,
  ): Promise<InventoryTransfer> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id: dailySalesId },
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status === 'finalized') {
      throw new BadRequestException(
        'Cannot add transfer to finalized daily sales',
      );
    }

    const { fromProductId, toProductId, quantity, notes } = createTransferDto;

    // Get products
    const fromProduct = await this.productRepository.findOne({
      where: { id: fromProductId },
    });

    const toProduct = await this.productRepository.findOne({
      where: { id: toProductId },
    });

    if (!fromProduct || !toProduct) {
      throw new NotFoundException('One or both products not found');
    }

    // Check if fromProduct has shotsPerBottle configured
    if (!fromProduct.shotsPerBottle) {
      throw new BadRequestException(
        `Product ${fromProduct.name} does not have shots per bottle configured`,
      );
    }

    // Check if there's enough stock
    if (fromProduct.currentStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${fromProduct.currentStock}`,
      );
    }

    const conversionRate = fromProduct.shotsPerBottle;
    const resultingQuantity = quantity * conversionRate;

    // Create transfer record
    const transfer = this.inventoryTransferRepository.create({
      dailySalesId,
      fromProductId,
      toProductId,
      quantity,
      conversionRate,
      resultingQuantity,
      userId,
      notes,
    });

    const savedTransfer = await this.inventoryTransferRepository.save(transfer);

    // Update product stocks
    fromProduct.currentStock -= quantity;
    toProduct.currentStock += resultingQuantity;

    await this.productRepository.save([fromProduct, toProduct]);

    return savedTransfer;
  }

  async remove(id: string): Promise<{ message: string }> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status === 'finalized') {
      throw new BadRequestException(
        'Cannot delete finalized daily sales record',
      );
    }

    await this.dailySalesRepository.remove(dailySales);
    return { message: 'Daily sales record deleted successfully' };
  }

  // Analytics and Reporting
  async getWeeklySummary(startDate?: string): Promise<any> {
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 7);

    const sales = await this.dailySalesRepository.find({
      where: {
        date: MoreThanOrEqual(start),
      },
      order: { date: 'ASC' },
    });

    const totalSales = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalSales.toString()),
      0,
    );
    const totalCollected = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalCollected.toString()),
      0,
    );
    const totalExpenses = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalExpenses.toString()),
      0,
    );

    return {
      period: 'Last 7 Days',
      days: sales.length,
      totalSales,
      totalCollected,
      totalExpenses,
      netRevenue: totalSales - totalExpenses,
      averageDailySales: sales.length > 0 ? totalSales / sales.length : 0,
      dailyBreakdown: sales,
    };
  }

  async getMonthlySummary(year: number, month: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const sales = await this.dailySalesRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    const totalSales = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalSales.toString()),
      0,
    );
    const totalCollected = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalCollected.toString()),
      0,
    );
    const totalExpenses = sales.reduce(
      (sum, sale) => sum + parseFloat(sale.totalExpenses.toString()),
      0,
    );

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      days: sales.length,
      totalSales,
      totalCollected,
      totalExpenses,
      netRevenue: totalSales - totalExpenses,
      averageDailySales: sales.length > 0 ? totalSales / sales.length : 0,
      dailyBreakdown: sales,
    };
  }
}
