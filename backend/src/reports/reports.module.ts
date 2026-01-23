import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';
import { DailySales } from '../database/entities/daily-sales.entity';
import { DailyInventory } from '../database/entities/daily-inventory.entity';
import { DailyExpense } from '../database/entities/daily-expense.entity';
import { Product } from '../database/entities/product.entity';
import { ProductCategory } from '../database/entities/product-category.entity';
import { StockPurchase } from 'src/database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      Bill,
      Payment,
      DailySales,
      DailyInventory,
      DailyExpense,
      Product,
      ProductCategory,
      StockPurchase,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
