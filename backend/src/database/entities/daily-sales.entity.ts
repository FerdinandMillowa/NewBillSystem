import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DailyInventory } from './daily-inventory.entity';
import { DailyExpense } from './daily-expense.entity';
import { StockPurchase } from './stock-purchase.entity';
import { InventoryTransfer } from './inventory-transfer.entity';
import { Bill } from './bill.entity';

@Entity('daily_sales')
@Index(['date'], { unique: true })
export class DailySales {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  date: Date;

  // ===== REVENUE COLLECTION =====
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cash: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'airtel_money',
  })
  airtelMoney: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  mpamba: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  bank: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_collected' })
  totalCollected: number; // cash + airtelMoney + mpamba + bank

  // ===== SALES CALCULATIONS =====
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'total_sales' })
  totalSales: number; // ✅ FIX: Sum of inventory sold ONLY (no bills)

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'bills_amount',
    default: 0,
  })
  billsAmount: number; // ✅ FIX: Credit sales (subtracted from cash, not added to sales)

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    name: 'actual_cash_collected',
  })
  actualCashCollected: number | null; // Physical cash counted by manager

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  shortage: number; // ✅ NEW: cashAtHand - actualCashCollected (if entered), else totalSales - totalCollected

  // ===== EXPENSES =====
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_expenses',
    default: 0,
  })
  totalExpenses: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'cash_expenses',
    default: 0,
  })
  cashExpenses: number; // Expenses paid in cash

  // ===== NET CALCULATIONS =====
  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'net_revenue' })
  netRevenue: number; // totalSales - totalExpenses

  @Column({ type: 'decimal', precision: 12, scale: 2, name: 'cash_at_hand' })
  cashAtHand: number; // cash - cashExpenses

  // ===== STOCK PURCHASES (tracked separately) =====
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    name: 'total_stock_purchases',
    default: 0,
  })
  totalStockPurchases: number; // Total amount spent on stock

  // ===== STATUS & NOTES =====
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'enum', enum: ['draft', 'finalized'], default: 'draft' })
  status: string;

  @Column({ type: 'timestamp', nullable: true, name: 'finalized_at' })
  finalizedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => DailyInventory, (inventory) => inventory.dailySales)
  inventories: DailyInventory[];

  @OneToMany(() => DailyExpense, (expense) => expense.dailySales)
  expenses: DailyExpense[];

  @OneToMany(() => StockPurchase, (purchase) => purchase.dailySales)
  stockPurchases: StockPurchase[];

  @OneToMany(() => InventoryTransfer, (transfer) => transfer.dailySales)
  inventoryTransfers: InventoryTransfer[];

  // Add bills relationship
  @OneToMany(() => Bill, (bill) => bill.dailySales)
  bills: Bill[];
}
