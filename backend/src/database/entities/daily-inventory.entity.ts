import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { DailySales } from './daily-sales.entity';
import { Product } from './product.entity';

@Entity('daily_inventory')
@Index(['dailySalesId', 'productId'], { unique: true })
export class DailyInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'daily_sales_id', type: 'uuid' })
  dailySalesId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'int', name: 'opening_stock' })
  openingStock: number;

  @Column({ type: 'int', name: 'stock_in', default: 0 })
  stockIn: number; // Stock purchased/added during the day

  @Column({ type: 'int', name: 'closing_stock' })
  closingStock: number;

  @Column({ type: 'int', name: 'sold_quantity' })
  soldQuantity: number; // (opening + stockIn) - closing

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'product_price' })
  productPrice: number; // Price at time of sale

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  revenue: number; // soldQuantity * productPrice

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => DailySales, (sales) => sales.inventories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_sales_id' })
  dailySales: DailySales;

  @ManyToOne(() => Product, (product) => product.dailyInventories)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
