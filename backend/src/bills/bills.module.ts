import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill } from '../database/entities/bill.entity';
import { Customer } from '../database/entities/customer.entity';
import { DailySales } from '../database/entities/daily-sales.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Customer, DailySales])],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
