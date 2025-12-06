import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, IsNull } from 'typeorm';
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

  // ✅ NEW METHOD: Get or create draft daily sales for a date
  async getOrCreateDraftForDate(date: string): Promise<DailySales> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Try to find existing record
    let dailySales = await this.dailySalesRepository.findOne({
      where: { date: targetDate },
      relations: ['inventories', 'expenses', 'stockPurchases', 'bills'],
    });

    // If exists, return it
    if (dailySales) {
      return dailySales;
    }

    // If doesn't exist, create a minimal draft
    // Get all active products for initialization
    const products = await this.productRepository.find({
      where: { isActive: true },
    });

    // Initialize with current stock as opening and closing stock
    const inventories = products.map((product) => ({
      productId: product.id,
      openingStock: product.currentStock,
      stockIn: 0,
      closingStock: product.currentStock,
    }));

    // Create draft with minimal data
    const createDto: CreateDailySalesDto = {
      date,
      inventories,
      expenses: [],
      stockPurchases: [],
    };

    // Create the daily sales record
    dailySales = await this.create(createDto);

    return dailySales;
  }

  async create(createDailySalesDto: CreateDailySalesDto): Promise<DailySales> {
    const {
      date,
      inventories,
      expenses,
      stockPurchases,
      actualCashCollected,
      ...salesData
    } = createDailySalesDto;

    // Check if daily sales already exists for this date
    const existingSales = await this.dailySalesRepository.findOne({
      where: { date: new Date(date) },
    });

    if (existingSales) {
      throw new ConflictException(
        'Daily sales record already exists for this date.',
      );
    }

    // Check if previous day is finalized (sequential validation)
    await this.validateSequentialFinalization(new Date(date));

    // Fetch bills for this date
    const billsForDate = await this.billRepository.find({
      where: {
        createdAt: Between(
          new Date(date + 'T00:00:00'),
          new Date(date + 'T23:59:59'),
        ),
        dailySalesId: IsNull(),
      },
      relations: ['customer'],
    });

    // Calculate bills amount
    const billsAmount = billsForDate.reduce(
      (sum, bill) => sum + parseFloat(bill.amount?.toString() || '0'),
      0,
    );

    // Process stock purchases and validate Stock In
    const purchasedProducts = new Map<string, number>();

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

        const existingPurchased =
          purchasedProducts.get(purchaseItem.productId) || 0;
        purchasedProducts.set(
          purchaseItem.productId,
          existingPurchased + purchaseItem.quantity,
        );
      }
    }

    // Validate Stock In with Stock Purchases
    for (const invItem of inventories) {
      const stockIn = invItem.stockIn || 0;
      const purchased = purchasedProducts.get(invItem.productId) || 0;

      if (stockIn > 0 && purchased === 0) {
        const product = await this.productRepository.findOne({
          where: { id: invItem.productId },
        });
        throw new BadRequestException(
          `Stock In entered for "${product?.name}" but no Stock Purchase recorded.`,
        );
      }

      if (stockIn > 0 && purchased > 0 && stockIn !== purchased) {
        const product = await this.productRepository.findOne({
          where: { id: invItem.productId },
        });
        throw new BadRequestException(
          `Stock In (${stockIn}) does not match Stock Purchase (${purchased}) for "${product?.name}".`,
        );
      }
    }

    // Process inventory items and calculate total sales FROM INVENTORY ONLY
    let totalSalesFromInventory = 0;
    const inventoryRecords: DailyInventory[] = [];

    for (const invItem of inventories) {
      const product = await this.productRepository.findOne({
        where: { id: invItem.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${invItem.productId} not found`);
      }

      const actualStockIn = invItem.stockIn || 0;
      const soldQuantity =
        invItem.openingStock + actualStockIn - invItem.closingStock;

      if (soldQuantity < 0) {
        throw new BadRequestException(
          `Invalid inventory for ${product.name}. Sold quantity cannot be negative.`,
        );
      }

      const revenue = soldQuantity * product.currentPrice;
      totalSalesFromInventory += revenue;

      inventoryRecords.push(
        this.dailyInventoryRepository.create({
          productId: invItem.productId,
          openingStock: invItem.openingStock,
          stockIn: actualStockIn,
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

    // ✅ FIX: Total Sales = Inventory Sales ONLY (no bills)
    const totalSales = totalSalesFromInventory;

    // Process expenses correctly
    let totalExpenses = 0;
    let cashExpenses = 0;
    const expenseRecords: DailyExpense[] = [];

    if (expenses && expenses.length > 0) {
      for (const expItem of expenses) {
        const paymentMethod = expItem.paymentMethod || 'cash';
        const amount = parseFloat(String(expItem.amount)) || 0;
        totalExpenses += amount;

        if (paymentMethod === 'cash') {
          cashExpenses += amount;
        }

        expenseRecords.push(
          this.dailyExpenseRepository.create({
            category: expItem.category as any,
            description: expItem.description,
            amount,
            paymentMethod: paymentMethod as any,
          }),
        );
      }
    }

    // Process stock purchases records
    let totalStockPurchases = 0;
    const stockPurchaseRecords: StockPurchase[] = [];

    if (stockPurchases && stockPurchases.length > 0) {
      for (const purchaseItem of stockPurchases) {
        const quantity = parseFloat(String(purchaseItem.quantity)) || 0;
        const unitCost = parseFloat(String(purchaseItem.unitCost)) || 0;
        const totalCost = quantity * unitCost;
        totalStockPurchases += totalCost;

        stockPurchaseRecords.push(
          this.stockPurchaseRepository.create({
            productId: purchaseItem.productId,
            quantity,
            unitCost,
            totalCost,
            paymentMethod: purchaseItem.paymentMethod as any,
            supplier: purchaseItem.supplier,
            notes: purchaseItem.notes,
          }),
        );
      }
    }

    // Parse revenue collections
    const airtelMoney = parseFloat(String(salesData.airtelMoney)) || 0;
    const mpamba = parseFloat(String(salesData.mpamba)) || 0;
    const bank = parseFloat(String(salesData.bank)) || 0;
    const nonCashCollected = airtelMoney + mpamba + bank;

    // ✅ CRITICAL FIX: Cash at Hand Calculation
    const cashAtHand =
      totalSalesFromInventory - totalExpenses - nonCashCollected - billsAmount;

    // Total collected = Cash + Other payment methods (NOT including bills)
    const totalCollected = cashAtHand + nonCashCollected;

    // ✅ CRITICAL FIX: Actual Cash Collected (optional, manager input)
    // IMPORTANT: Check if actualCashCollected is explicitly provided AND not undefined/null
    let actualCash: number | null = null;
    if (actualCashCollected !== undefined && actualCashCollected !== null) {
      actualCash = parseFloat(String(actualCashCollected));
    }

    // ✅ CRITICAL FIX: Shortage ONLY calculated if manager entered actual cash
    // Logic:
    // 1. If actualCash is null (not entered) → shortage = 0 (not calculated)
    // 2. If actualCash is provided → shortage = cashAtHand - actualCash (if positive)
    let shortage = 0;
    if (actualCash !== null) {
      const difference = cashAtHand - actualCash;
      shortage = difference > 0 ? difference : 0; // Only positive shortages
    }

    // Net revenue = Total Sales - Expenses
    const netRevenue = totalSales - totalExpenses;

    // Create daily sales record
    const dailySales = this.dailySalesRepository.create({
      date: new Date(date),
      cash: cashAtHand, // System-calculated expected cash
      airtelMoney,
      mpamba,
      bank,
      totalCollected,
      totalSales, // ✅ Inventory sales only
      billsAmount, // ✅ Credit sales (tracked separately)
      actualCashCollected: actualCash, // ✅ null if not entered
      shortage, // ✅ 0 if actualCash is null, otherwise calculated
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
    try {
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

      // Link bills to this daily sales record
      if (billsForDate.length > 0) {
        for (const bill of billsForDate) {
          bill.dailySalesId = savedSales.id;
        }
        await this.billRepository.save(billsForDate);
      }
    } catch (error) {
      await this.dailySalesRepository.remove(savedSales);
      throw error;
    }

    return this.findOne(savedSales.id);
  }

  // ✅ CRITICAL FIX: Method to update actual cash collected (manager/admin only)
  async updateActualCashCollected(
    id: string,
    actualCashCollected: number | null,
  ): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status !== 'finalized') {
      throw new BadRequestException(
        'Can only update actual cash for finalized daily sales',
      );
    }

    // ✅ CRITICAL FIX: Handle null/undefined correctly
    let actualCash: number | null = null;
    let shortage = 0;

    // Only calculate shortage if actualCashCollected is explicitly provided
    if (actualCashCollected !== undefined && actualCashCollected !== null) {
      actualCash = parseFloat(String(actualCashCollected));
      const cashAtHand = parseFloat(String(dailySales.cashAtHand)) || 0;

      // Calculate shortage: Expected - Actual
      const difference = cashAtHand - actualCash;
      shortage = difference > 0 ? difference : 0; // Only positive shortages
    }

    dailySales.actualCashCollected = actualCash;
    dailySales.shortage = shortage;

    return this.dailySalesRepository.save(dailySales);
  }

  private async validateSequentialFinalization(
    currentDate: Date,
  ): Promise<void> {
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);

    const previousDaySales = await this.dailySalesRepository.findOne({
      where: { date: previousDay },
    });

    if (previousDaySales && previousDaySales.status !== 'finalized') {
      const dateStr = previousDay.toISOString().split('T')[0];
      throw new BadRequestException(
        `Previous day (${dateStr}) sales are not finalized.`,
      );
    }
  }

  async findAll(queryDto: QueryDailySalesDto): Promise<{
    sales: DailySales[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { startDate, endDate, status, page = 1, limit = 30 } = queryDto;

    const queryBuilder = this.dailySalesRepository
      .createQueryBuilder('dailySales')
      .leftJoinAndSelect('dailySales.inventories', 'inventories')
      .leftJoinAndSelect('inventories.product', 'product')
      .leftJoinAndSelect('dailySales.expenses', 'expenses')
      .leftJoinAndSelect('dailySales.stockPurchases', 'stockPurchases')
      .leftJoinAndSelect('dailySales.bills', 'bills')
      .leftJoinAndSelect('bills.customer', 'customer')
      .orderBy('dailySales.date', 'DESC');

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

    if (status) {
      queryBuilder.andWhere('dailySales.status = :status', { status });
    }

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
        'inventories.product.category',
        'expenses',
        'stockPurchases',
        'stockPurchases.product',
        'inventoryTransfers',
        'bills',
        'bills.customer',
      ],
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    return dailySales;
  }

  async findByDate(date: string): Promise<DailySales> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const dailySales = await this.dailySalesRepository.findOne({
      where: { date: targetDate },
      relations: [
        'inventories',
        'inventories.product',
        'inventories.product.category',
        'expenses',
        'stockPurchases',
        'stockPurchases.product',
        'inventoryTransfers',
        'bills',
        'bills.customer',
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
        'inventories.product.category',
        'expenses',
        'stockPurchases',
        'stockPurchases.product',
        'bills',
        'bills.customer',
      ],
    });
  }

  async update(
    id: string,
    updateDailySalesDto: UpdateDailySalesDto,
  ): Promise<DailySales> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id },
      relations: ['inventories', 'expenses', 'stockPurchases'],
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status === 'finalized') {
      throw new BadRequestException(
        'Cannot update finalized daily sales record. Admin must unlock it first.',
      );
    }

    const { inventories, expenses, stockPurchases, ...salesData } =
      updateDailySalesDto;

    if (dailySales.inventories?.length > 0) {
      await this.dailyInventoryRepository.remove(dailySales.inventories);
    }
    if (dailySales.expenses?.length > 0) {
      await this.dailyExpenseRepository.remove(dailySales.expenses);
    }
    if (dailySales.stockPurchases?.length > 0) {
      await this.stockPurchaseRepository.remove(dailySales.stockPurchases);
    }

    const dateStr = dailySales.date.toISOString().split('T')[0];
    await this.dailySalesRepository.remove(dailySales);

    return this.create({
      date: dateStr,
      inventories: inventories || [],
      expenses: expenses || [],
      stockPurchases: stockPurchases || [],
      ...salesData,
    });
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

    const fromProduct = await this.productRepository.findOne({
      where: { id: fromProductId },
    });

    const toProduct = await this.productRepository.findOne({
      where: { id: toProductId },
    });

    if (!fromProduct || !toProduct) {
      throw new NotFoundException('One or both products not found');
    }

    if (!fromProduct.shotsPerBottle) {
      throw new BadRequestException(
        `Product ${fromProduct.name} does not have shots per bottle configured`,
      );
    }

    if (fromProduct.currentStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${fromProduct.currentStock}`,
      );
    }

    const conversionRate = fromProduct.shotsPerBottle;
    const resultingQuantity = quantity * conversionRate;

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

  async getBillsForDate(date: string, dailySalesId?: string): Promise<Bill[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    if (dailySalesId) {
      return this.billRepository.find({
        where: {
          dailySalesId,
        },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.billRepository.find({
      where: {
        createdAt: Between(startOfDay, endOfDay),
        dailySalesId: IsNull(),
      },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }
}
