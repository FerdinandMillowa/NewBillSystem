import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  IsNull,
  LessThan,
} from 'typeorm';
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

  async findNearestBefore(targetDate: string): Promise<DailySales | null> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: {
        date: LessThan(new Date(targetDate)),
        status: 'finalized', // Only use finalized records
      },
      order: {
        date: 'DESC', // Most recent first
      },
      relations: ['inventories', 'inventories.product'],
    });

    return dailySales;
  }

  async getOrCreateDraftForDate(date: string): Promise<DailySales> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let dailySales = await this.dailySalesRepository.findOne({
      where: { date: targetDate },
      relations: [
        'inventories',
        'expenses',
        'stockPurchases',
        'bills',
        'bills.customer',
      ],
    });

    if (dailySales) {
      return dailySales;
    }

    const products = await this.productRepository.find({
      where: { isActive: true },
    });

    // ✅ Find previous finalized record
    const previousRecord = await this.findNearestBefore(date);

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

    // ✅ Copy closing stock as opening stock from previous day
    if (previousRecord && previousRecord.inventories) {
      for (const prevInv of previousRecord.inventories) {
        const product = products.find((p) => p.id === prevInv.productId);
        if (product) {
          inventoryRecords.push(
            this.dailyInventoryRepository.create({
              dailySalesId: dailySales.id,
              productId: prevInv.productId,
              openingStock: prevInv.closingStock, // ✅ This is the key
              stockIn: 0,
              closingStock: prevInv.closingStock,
              soldQuantity: 0,
              productPrice: product.currentPrice,
              revenue: 0,
              convertedOut: 0,
              convertedIn: 0,
            }),
          );
        }
      }
    } else {
      // Fallback: Create from current product stock
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
            convertedOut: 0,
            convertedIn: 0,
          }),
        );
      }
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

    // ✅ AUTO-POPULATE stockIn from purchases
    const updatedInventories = [...inventories];
    for (let i = 0; i < updatedInventories.length; i++) {
      const invItem = updatedInventories[i];
      const purchased = purchasedProducts.get(invItem.productId) || 0;

      if (purchased > 0) {
        updatedInventories[i] = {
          ...invItem,
          stockIn: purchased,
        };
      }
    }

    let totalSalesFromInventory = 0;
    const inventoryRecords: DailyInventory[] = [];

    for (const invItem of updatedInventories) {
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
          convertedOut: 0,
          convertedIn: 0,
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
            supplierId: purchaseItem.supplierId || null,
            notes: purchaseItem.notes,
            transactionDate: new Date(date),
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

    // Build purchased products map
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

    // ✅ AUTO-POPULATE stockIn from purchases (in update method)
    const updatedInventories = [...(inventories || [])];
    for (let i = 0; i < updatedInventories.length; i++) {
      const invItem = updatedInventories[i];
      const purchased = purchasedProducts.get(invItem.productId) || 0;

      if (purchased > 0) {
        updatedInventories[i] = {
          ...invItem,
          stockIn: purchased,
        };
      }
    }

    let totalSalesFromInventory = 0;
    const inventoryRecords: DailyInventory[] = [];

    if (updatedInventories && updatedInventories.length > 0) {
      for (const invItem of updatedInventories) {
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
            convertedOut: 0,
            convertedIn: 0,
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
            transactionDate: new Date(dailySales.date),
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
            supplierId: purchaseItem.supplierId || null,
            notes: purchaseItem.notes,
            transactionDate: new Date(dailySales.date),
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

  async createInventoryTransfer(
    dailySalesId: string,
    createTransferDto: CreateInventoryTransferDto,
    userId: string,
  ): Promise<DailySales> {
    const { fromProductId, toProductId, quantity, notes } = createTransferDto;

    const dailySales = await this.dailySalesRepository.findOne({
      where: { id: dailySalesId },
      relations: ['inventories', 'inventories.product'],
    });

    if (!dailySales) {
      throw new NotFoundException('Daily sales record not found');
    }

    if (dailySales.status === 'finalized') {
      throw new BadRequestException(
        'Cannot convert bottles on finalized daily sales',
      );
    }

    const bottle = await this.productRepository.findOne({
      where: { id: fromProductId },
    });

    if (!bottle) {
      throw new NotFoundException('Bottle product not found');
    }

    if (bottle.unit !== 'bottle') {
      throw new BadRequestException('Source product must be a bottle');
    }

    if (
      !bottle.linkedShotProductId ||
      bottle.linkedShotProductId !== toProductId
    ) {
      throw new BadRequestException(
        'Invalid conversion: Shot product not properly linked',
      );
    }

    if (bottle.currentStock < quantity) {
      throw new BadRequestException(
        `Insufficient bottle stock. Available: ${bottle.currentStock}, Required: ${quantity}`,
      );
    }

    const shotsPerBottle = bottle.shotsPerBottle || 0;
    if (shotsPerBottle <= 0) {
      throw new BadRequestException(
        'Shots per bottle must be configured for this product',
      );
    }

    const shotProduct = await this.productRepository.findOne({
      where: { id: toProductId },
    });

    if (!shotProduct) {
      throw new NotFoundException('Shot product not found');
    }

    if (shotProduct.unit !== 'shot') {
      throw new BadRequestException('Target product must be a shot');
    }

    const shotsGenerated = quantity * shotsPerBottle;

    // Update MASTER inventory
    bottle.currentStock -= quantity;
    shotProduct.currentStock += shotsGenerated;
    await this.productRepository.save([bottle, shotProduct]);

    // Update DAILY inventory records
    let bottleInventory = dailySales.inventories.find(
      (inv) => inv.productId === fromProductId,
    );

    if (!bottleInventory) {
      bottleInventory = this.dailyInventoryRepository.create({
        dailySalesId,
        productId: fromProductId,
        openingStock: bottle.currentStock + quantity,
        stockIn: 0,
        closingStock: bottle.currentStock,
        soldQuantity: 0,
        convertedOut: quantity, // ✅ Set conversion out
        convertedIn: 0,
        productPrice: bottle.currentPrice,
        revenue: 0,
      });
    } else {
      bottleInventory.closingStock -= quantity;
      bottleInventory.convertedOut =
        (bottleInventory.convertedOut || 0) + quantity; // ✅ Track conversion

      // ✅ Recalculate sold quantity EXCLUDING conversions
      const totalAvailable =
        bottleInventory.openingStock + bottleInventory.stockIn;
      const actualSold =
        totalAvailable -
        bottleInventory.closingStock -
        bottleInventory.convertedOut;
      bottleInventory.soldQuantity = Math.max(0, actualSold);
    }

    let shotInventory = dailySales.inventories.find(
      (inv) => inv.productId === toProductId,
    );

    if (!shotInventory) {
      shotInventory = this.dailyInventoryRepository.create({
        dailySalesId,
        productId: toProductId,
        openingStock: Math.max(0, shotProduct.currentStock - shotsGenerated),
        stockIn: shotsGenerated, // ✅ Shots come from bottle conversion
        closingStock: shotProduct.currentStock,
        soldQuantity: 0,
        convertedOut: 0,
        convertedIn: shotsGenerated, // ✅ Set conversion in
        productPrice: shotProduct.currentPrice,
        revenue: 0,
      });
    } else {
      shotInventory.stockIn += shotsGenerated;
      shotInventory.convertedIn =
        (shotInventory.convertedIn || 0) + shotsGenerated; // ✅ Track conversion
      shotInventory.closingStock += shotsGenerated;

      // Recalculate sold quantity (convertedIn is already in stockIn)
      shotInventory.soldQuantity =
        shotInventory.openingStock +
        shotInventory.stockIn -
        shotInventory.closingStock;
    }

    await this.dailyInventoryRepository.save([bottleInventory, shotInventory]);

    const transfer = this.inventoryTransferRepository.create({
      dailySalesId,
      fromProductId,
      toProductId,
      quantity,
      conversionRate: shotsPerBottle,
      resultingQuantity: shotsGenerated,
      userId,
      notes,
    });

    await this.inventoryTransferRepository.save(transfer);

    await this.recalculateTotals(dailySalesId);

    return this.findOne(dailySalesId);
  }

  private async recalculateTotals(dailySalesId: string): Promise<void> {
    const dailySales = await this.dailySalesRepository.findOne({
      where: { id: dailySalesId },
      relations: ['inventories', 'inventories.product', 'expenses', 'bills'],
    });

    if (!dailySales) return;

    let totalSales = 0;

    for (const inventory of dailySales.inventories) {
      // ✅ FIX: Calculate actual sold quantity EXCLUDING bottles converted out
      const soldQuantity =
        inventory.openingStock +
        inventory.stockIn -
        inventory.closingStock -
        (inventory.convertedOut || 0);

      const actualSold = Math.max(0, soldQuantity);
      const revenue = actualSold * inventory.productPrice;
      totalSales += revenue;

      inventory.soldQuantity = actualSold;
      inventory.revenue = revenue;
      await this.dailyInventoryRepository.save(inventory);
    }

    const billsAmount = (dailySales.bills || []).reduce(
      (sum, bill) => sum + parseFloat(bill.amount?.toString() || '0'),
      0,
    );

    const totalExpenses = (dailySales.expenses || []).reduce(
      (sum, expense) => sum + parseFloat(expense.amount?.toString() || '0'),
      0,
    );

    const cashExpenses = (dailySales.expenses || [])
      .filter((exp) => exp.paymentMethod === 'cash')
      .reduce(
        (sum, expense) => sum + parseFloat(expense.amount?.toString() || '0'),
        0,
      );

    const nonCashCollected =
      (dailySales.airtelMoney || 0) +
      (dailySales.mpamba || 0) +
      (dailySales.bank || 0);

    const cashAtHand =
      totalSales - totalExpenses - nonCashCollected - billsAmount;

    const totalCollected = cashAtHand + nonCashCollected;
    const netRevenue = totalSales - totalExpenses;

    dailySales.totalSales = totalSales;
    dailySales.billsAmount = billsAmount;
    dailySales.totalExpenses = totalExpenses;
    dailySales.cashExpenses = cashExpenses;
    dailySales.cashAtHand = cashAtHand;
    dailySales.cash = cashAtHand;
    dailySales.totalCollected = totalCollected;
    dailySales.netRevenue = netRevenue;

    await this.dailySalesRepository.save(dailySales);
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

  // ✅ FIX: Use DATE() query as requested for precise separation
  async getBillsForDate(date: string, dailySalesId?: string): Promise<Bill[]> {
    const query = this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.customer', 'customer')
      .where('DATE(bill.createdAt) = :date', { date });

    if (dailySalesId) {
      query.andWhere('bill.dailySalesId = :dailySalesId', { dailySalesId });
    } else {
      query.andWhere('bill.dailySalesId IS NULL');
    }

    return query.orderBy('bill.createdAt', 'DESC').getMany();
  }
}
