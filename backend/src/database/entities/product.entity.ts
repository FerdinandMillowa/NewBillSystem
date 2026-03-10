import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ProductCategory } from './product-category.entity';
import { PriceHistory } from './price-history.entity';
import { DailyInventory } from './daily-inventory.entity';
import { StockPurchase } from './stock-purchase.entity';
import { InventoryTransfer } from './inventory-transfer.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit: string; // e.g., 'bottle', 'can', 'piece', 'shot'

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string; // e.g., '750ml', '330ml', '1L'

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'current_price' })
  currentPrice: number;

  @Column({ type: 'int', name: 'current_stock', default: 0 })
  currentStock: number;

  // For bottle-to-shot conversion
  @Column({ type: 'int', nullable: true, name: 'shots_per_bottle' })
  shotsPerBottle: number; // e.g., 25 shots per 750ml bottle

  @Column({ type: 'uuid', nullable: true, name: 'linked_shot_product_id' })
  linkedShotProductId: string; // Links 750ml to shot version

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'cost_price',
    nullable: true,
  })
  costPrice: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => ProductCategory, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @OneToMany(() => PriceHistory, (history) => history.product)
  priceHistory: PriceHistory[];

  @OneToMany(() => DailyInventory, (inventory) => inventory.product)
  dailyInventories: DailyInventory[];

  @OneToMany(() => StockPurchase, (purchase) => purchase.product)
  stockPurchases: StockPurchase[];

  @OneToMany(() => InventoryTransfer, (transfer) => transfer.fromProduct)
  transfersFrom: InventoryTransfer[];

  @OneToMany(() => InventoryTransfer, (transfer) => transfer.toProduct)
  transfersTo: InventoryTransfer[];
}
