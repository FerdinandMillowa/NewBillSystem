import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailySales } from './daily-sales.entity';
import { PaymentMethod } from '../../common/enums';

export enum ExpenseCategory {
  UTILITIES = 'utilities',
  SUPPLIES = 'supplies',
  WAGES = 'wages',
  TRANSPORT = 'transport',
  MAINTENANCE = 'maintenance',
  OTHER = 'other',
}

@Entity('daily_expenses')
export class DailyExpense {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'daily_sales_id', type: 'uuid' })
  dailySalesId: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => DailySales, (sales) => sales.expenses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_sales_id' })
  dailySales: DailySales;
}
