import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Bill, Payment])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
