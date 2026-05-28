import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_INTERCEPTOR } from '@nestjs/core';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { BillsModule } from './bills/bills.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { ProductsModule } from './products/products.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { DailySalesModule } from './daily-sales/daily-sales.module';
import { ActivityLogInterceptor } from './common/interceptors/activity-log.interceptor';
import { SuppliersModule } from './suppliers/suppliers.module';
import { FixedExpensesModule } from './fixed-expenses/fixed-expenses.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaychanguModule } from './paychangu/paychangu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    UsersModule,
    CustomersModule,
    BillsModule,
    PaymentsModule,
    ReportsModule,
    ActivityLogsModule,
    ProductsModule,
    ProductCategoriesModule,
    DailySalesModule,
    SuppliersModule,
    FixedExpensesModule,
    NotificationsModule,
    PaychanguModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogInterceptor,
    },
  ],
})
export class AppModule {}
