import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaychanguService } from './paychangu.service';
import { PaychanguController } from './paychangu.controller';
import { PaymentsModule } from '../payments/payments.module';
import { CustomersModule } from '../customers/customers.module';
import { Bill } from '../database/entities/bill.entity';
import { Payment } from '../database/entities/payment.entity';

@Module({
  imports: [
    // Bill and Payment repositories used directly in the controller
    // for balance calculation and duplicate-webhook guard
    TypeOrmModule.forFeature([Bill, Payment]),
    // PaymentsModule exports PaymentsService (used to record webhook payments)
    PaymentsModule,
    // CustomersModule exports CustomersService (used for findOneWithBalance)
    CustomersModule,
  ],
  controllers: [PaychanguController],
  providers: [PaychanguService],
  exports: [PaychanguService],
})
export class PaychanguModule {}
