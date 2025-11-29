import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailySalesService } from './daily-sales.service';
import { DailySalesController } from './daily-sales.controller';
import { DailySales } from '../database/entities/daily-sales.entity';
import { DailyInventory } from '../database/entities/daily-inventory.entity';
import { DailyExpense } from '../database/entities/daily-expense.entity';
import { StockPurchase } from '../database/entities/stock-purchase.entity';
import { InventoryTransfer } from '../database/entities/inventory-transfer.entity';
import { Product } from '../database/entities/product.entity';
import { Bill } from '../database/entities/bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DailySales,
      DailyInventory,
      DailyExpense,
      StockPurchase,
      InventoryTransfer,
      Product,
      Bill,
    ]),
  ],
  controllers: [DailySalesController],
  providers: [DailySalesService],
  exports: [DailySalesService],
})
export class DailySalesModule {}
