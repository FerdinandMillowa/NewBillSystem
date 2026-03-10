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
import { Supplier } from './supplier.entity';
import { PaymentMethod } from '../../common/enums';

@Entity('stock_purchases')
export class StockPurchase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'daily_sales_id', type: 'uuid', nullable: true })
  dailySalesId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_cost' })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_cost' })
  totalCost: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  // Replaced free-text supplier with FK reference
  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'transaction_date', type: 'date' })
  transactionDate: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => DailySales, (sales) => sales.stockPurchases, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'daily_sales_id' })
  dailySales: DailySales;

  @ManyToOne(() => Product, (product) => product.stockPurchases)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => Supplier, (supplier) => supplier.stockPurchases, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;
}
