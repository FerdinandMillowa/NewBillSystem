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
import { User } from './user.entity';

@Entity('inventory_transfers')
export class InventoryTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'daily_sales_id', type: 'uuid' })
  dailySalesId: string;

  @Column({ name: 'from_product_id', type: 'uuid' })
  fromProductId: string; // e.g., Jameson 750ml

  @Column({ name: 'to_product_id', type: 'uuid' })
  toProductId: string; // e.g., Jameson Shot

  @Column({ type: 'int' })
  quantity: number; // Number of bottles opened

  @Column({ type: 'int', name: 'conversion_rate' })
  conversionRate: number; // Shots per bottle (e.g., 25)

  @Column({ type: 'int', name: 'resulting_quantity' })
  resultingQuantity: number; // quantity * conversionRate

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // Who performed the transfer

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => DailySales, (sales) => sales.inventoryTransfers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'daily_sales_id' })
  dailySales: DailySales;

  @ManyToOne(() => Product, (product) => product.transfersFrom)
  @JoinColumn({ name: 'from_product_id' })
  fromProduct: Product;

  @ManyToOne(() => Product, (product) => product.transfersTo)
  @JoinColumn({ name: 'to_product_id' })
  toProduct: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
