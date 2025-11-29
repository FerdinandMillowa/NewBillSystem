import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity('price_history')
export class PriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string; // Admin who changed the price

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'old_price' })
  oldPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'new_price' })
  newPrice: number;

  @Column({ type: 'date', name: 'effective_date' })
  effectiveDate: Date; // Price takes effect next day

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => Product, (product) => product.priceHistory)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
