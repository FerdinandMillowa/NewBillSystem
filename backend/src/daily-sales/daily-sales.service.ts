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

  async getOrCreateDraftForDate(date: string): Promise<DailySales> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let dailySales = await this.dailySalesRepository.findOne({
      where: { date: targetDate },
      relations: ['inventories', 'expenses', 'stockPurchases', 'bills'],
    });

    if (dailySales) {
      return dailySales;
    }

    const products = await this.productRepository.find({
      where: { isActive: true },
    });

    const dailySalesEntity = this.dailySalesRepository.create({
      date: targetDate,
      status: 'draft',
      totalSales: 0,
      totalCollected: 0,
      billsAmount: 0,
      totalExpenses: 0,
      cashExpenses: 0,
      netRevenue: 0,
      totalStockPurchases: 0,
      cash: 0,
      cashAtHand: 0,
      airtelMoney: 0,
      mpamba: 0,
      bank: 0,
    });

    dailySales = await this.dailySalesRepository.save(dailySalesEntity);

    const inventoryRecords: DailyInventory[] = [];
    for (const product of products) {
      inventoryRecords.push(
        this.dailyInventoryRepository.create({
          dailySalesId: dailySales.id,
          productId: product.id,
          openingStock: product.currentStock,
          stockIn: 0,
          closingStock: product.currentStock,
          soldQuantity: 0,
          productPrice: product.currentPrice,
          revenue: 0,
        }),
      );
    }

    if (inventoryRecords.length > 0) {
      await this.dailyInventoryRepository.save(inventoryRecords);
    }

    return this.findOne(dailySales.id);
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

    const existingSales = await this.dailySalesRepository.findOne({
      where: { date: new Date(date) },
    });

    if (existingSales) {
      throw new ConflictException(
        'Daily sales record already exists for this date.',
      );
    }

    await this.validateSequentialFinalization(new Date(date));

    // Bills will only be linked when explicitly created from Daily Sales page
    const billsAmount = 0;

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

      product.currentStock = invItem.closingStock;
      await this.productRepository.save(product);
    }

    const totalSales = totalSalesFromInventory;

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

    const airtelMoney = parseFloat(String(salesData.airtelMoney)) || 0;
    const mpamba = parseFloat(String(salesData.mpamba)) || 0;
    const bank = parseFloat(String(salesData.bank)) || 0;
    const nonCashCollected = airtelMoney + mpamba + bank;

    const cashAtHand =
      totalSalesFromInventory - totalExpenses - nonCashCollected - billsAmount;

    const totalCollected = cashAtHand + nonCashCollected;

    let actualCash: number | null = null;
    if (actualCashCollected !== undefined && actualCashCollected !== null) {
      actualCash = parseFloat(String(actualCashCollected));
    }

    let shortage = 0;
    if (actualCash !== null) {
      const difference = cashAtHand - actualCash;
      shortage = difference > 0 ? difference : 0;
    }

    const netRevenue = totalSales - totalExpenses;

    const dailySales = this.dailySalesRepository.create({
      date: new Date(date),
      cash: cashAtHand,
      airtelMoney,
      mpamba,
      bank,
      totalCollected,
      totalSales,
      billsAmount,
      actualCashCollected: actualCash,
      shortage,
      totalExpenses,
      cashExpenses,
      netRevenue,
      cashAtHand,
      totalStockPurchases,
      notes: salesData.notes,
      status: 'draft',
    });

    const savedSales = await this.dailySalesRepository.save(dailySales);

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
    } catch (error) {
      await this.dailySalesRepository.remove(savedSales);
      throw error;
    }

    return this.findOne(savedSales.id);
  }

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

    let actualCash: number | null = null;
    let shortage = 0;

    if (actualCashCollected !== undefined && actualCashCollected !== null) {
      actualCash = parseFloat(String(actualCashCollected));
      const cashAtHand = parseFloat(String(dailySales.cashAtHand)) || 0;

      const difference = cashAtHand - actualCash;
      shortage = difference > 0 ? difference : 0;
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
      relations: ['inventories', 'expenses', 'stockPurchases', 'bills'],
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

    const targetDate = new Date(dailySales.date);
    const billsForDate = await this.billRepository.find({
      where: {
        createdAt: Between(
          new Date(targetDate.toISOString().split('T')[0] + 'T00:00:00'),
          new Date(targetDate.toISOString().split('T')[0] + 'T23:59:59'),
        ),
        dailySalesId: id,
      },
      relations: ['customer'],
    });

    const billsAmount = billsForDate.reduce(
      (sum, bill) => sum + parseFloat(bill.amount?.toString() || '0'),
      0,
    );

    if (dailySales.inventories?.length > 0) {
      await this.dailyInventoryRepository.remove(dailySales.inventories);
    }
    if (dailySales.expenses?.length > 0) {
      await this.dailyExpenseRepository.remove(dailySales.expenses);
    }
    if (dailySales.stockPurchases?.length > 0) {
      await this.stockPurchaseRepository.remove(dailySales.stockPurchases);
    }

    let totalSalesFromInventory = 0;
    const inventoryRecords: DailyInventory[] = [];

    if (inventories && inventories.length > 0) {
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
            dailySalesId: id,
            productId: invItem.productId,
            openingStock: invItem.openingStock,
            stockIn: actualStockIn,
            closingStock: invItem.closingStock,
            soldQuantity,
            productPrice: product.currentPrice,
            revenue,
          }),
        );

        product.currentStock = invItem.closingStock;
        await this.productRepository.save(product);
      }
    }

    const totalSales = totalSalesFromInventory;

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
            dailySalesId: id,
            category: expItem.category as any,
            description: expItem.description,
            amount,
            paymentMethod: paymentMethod as any,
          }),
        );
      }
    }

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
            dailySalesId: id,
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

    const airtelMoney = parseFloat(String(salesData.airtelMoney)) || 0;
    const mpamba = parseFloat(String(salesData.mpamba)) || 0;
    const bank = parseFloat(String(salesData.bank)) || 0;
    const nonCashCollected = airtelMoney + mpamba + bank;

    const cashAtHand =
      totalSalesFromInventory - totalExpenses - nonCashCollected - billsAmount;

    const totalCollected = cashAtHand + nonCashCollected;

    let actualCash: number | null = null;
    if (
      salesData.actualCashCollected !== undefined &&
      salesData.actualCashCollected !== null
    ) {
      actualCash = parseFloat(String(salesData.actualCashCollected));
    }

    let shortage = 0;
    if (actualCash !== null) {
      shortage = cashAtHand - actualCash;
    }

    const netRevenue = totalSales - totalExpenses;

    Object.assign(dailySales, {
      cash: cashAtHand,
      airtelMoney,
      mpamba,
      bank,
      totalCollected,
      totalSales,
      billsAmount,
      actualCashCollected: actualCash,
      shortage,
      totalExpenses,
      cashExpenses,
      netRevenue,
      cashAtHand,
      totalStockPurchases,
      notes: salesData.notes,
    });

    await this.dailySalesRepository.save(dailySales);

    if (inventoryRecords.length > 0) {
      await this.dailyInventoryRepository.save(inventoryRecords);
    }
    if (expenseRecords.length > 0) {
      await this.dailyExpenseRepository.save(expenseRecords);
    }
    if (stockPurchaseRecords.length > 0) {
      await this.stockPurchaseRepository.save(stockPurchaseRecords);
    }

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

  /**
   * Updated method to handle bottle-to-shot conversion with critical validations
   * and daily inventory synchronization.
   */
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

    // ✅ CRITICAL FIX: Get products to check linking and units
    const fromProduct = await this.productRepository.findOne({
      where: { id: fromProductId },
    });

    const toProduct = await this.productRepository.findOne({
      where: { id: toProductId },
    });

    if (!fromProduct || !toProduct) {
      throw new NotFoundException('One or both products not found');
    }

    // ✅ CRITICAL VALIDATION: Ensure fromProduct is a bottle
    if (fromProduct.unit !== 'bottle') {
      throw new BadRequestException(
        `Product ${fromProduct.name} is not a bottle. Only bottles can be converted to shots.`,
      );
    }

    // ✅ CRITICAL VALIDATION: Ensure toProduct is a shot
    if (toProduct.unit !== 'shot') {
      throw new BadRequestException(
        `Product ${toProduct.name} is not a shot product.`,
      );
    }

    // ✅ CRITICAL VALIDATION: Check if products are properly linked
    if (fromProduct.linkedShotProductId !== toProduct.id) {
      throw new BadRequestException(
        `Product ${fromProduct.name} is not linked to ${toProduct.name}. ` +
          `Please ensure bottle products are properly linked to their shot versions in product setup.`,
      );
    }

    if (!fromProduct.shotsPerBottle) {
      throw new BadRequestException(
        `Product ${fromProduct.name} does not have shots per bottle configured`,
      );
    }

    if (fromProduct.currentStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${fromProduct.currentStock} bottles`,
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

    // ✅ Update both products' current physical stock
    fromProduct.currentStock -= quantity;
    toProduct.currentStock += resultingQuantity;

    await this.productRepository.save([fromProduct, toProduct]);

    // ✅ Update daily sales inventory records if they exist
    const fromInventory = await this.dailyInventoryRepository.findOne({
      where: {
        dailySalesId,
        productId: fromProductId,
      },
    });

    const toInventory = await this.dailyInventoryRepository.findOne({
      where: {
        dailySalesId,
        productId: toProductId,
      },
    });

    if (fromInventory) {
      // Bottle: Reduce closing stock as bottles are opened for shots
      fromInventory.closingStock = fromProduct.currentStock;
      await this.dailyInventoryRepository.save(fromInventory);
    }

    if (toInventory) {
      // Shot: Increase opening stock as new shots are added to available inventory
      toInventory.openingStock = toProduct.currentStock;
      toInventory.closingStock = toProduct.currentStock; // Will be adjusted by subsequent sales
      await this.dailyInventoryRepository.save(toInventory);
    }

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
