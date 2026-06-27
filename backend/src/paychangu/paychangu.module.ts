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
    TypeOrmModule.forFeature([Bill, Payment]),
    PaymentsModule,
    CustomersModule,
  ],
  controllers: [PaychanguController],
  providers: [PaychanguService],
  exports: [PaychanguService],
})
export class PaychanguModule {}
