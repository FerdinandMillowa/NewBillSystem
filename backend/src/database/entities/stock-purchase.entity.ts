import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DailySales } from './daily-sales.entity';
import { Product } from './product.entity';
import { PaymentMethod } from '../../common/enums';

@Entity('stock_purchases')
export class StockPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'daily_sales_id', type: 'uuid' })
  dailySalesId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost' })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_cost' })
  totalCost: number; // quantity * unitCost

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  supplier: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => DailySales, (sales) => sales.stockPurchases, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_sales_id' })
  dailySales: DailySales;

  @ManyToOne(() => Product, (product) => product.stockPurchases)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
