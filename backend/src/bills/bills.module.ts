import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsService } from './bills.service';
import { BillsController } from './bills.controller';
import { Bill } from '../database/entities/bill.entity';
import { Customer } from '../database/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, Customer])],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
