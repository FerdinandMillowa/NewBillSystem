import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from '../database/entities/payment.entity';
import { Customer } from '../database/entities/customer.entity';
import { Bill } from '../database/entities/bill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Customer, Bill])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
