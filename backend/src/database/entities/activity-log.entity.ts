import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum ActivityAction {
  // User actions
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',

  // Auth actions
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  REFRESH_TOKEN = 'refresh_token',

  // Approval actions
  APPROVE = 'approve',
  REJECT = 'reject',

  // Daily Sales actions
  FINALIZE = 'finalize',
  UNLOCK = 'unlock',
  UPDATE_CASH = 'update_cash',

  // Inventory actions
  TRANSFER = 'transfer',

  // Password actions
  RESET_PASSWORD = 'reset_password',
  CHANGE_PASSWORD = 'change_password',
}

export enum ActivityEntity {
  USER = 'user',
  CUSTOMER = 'customer',
  BILL = 'bill',
  PAYMENT = 'payment',
  PRODUCT = 'product',
  PRODUCT_CATEGORY = 'product_category',
  DAILY_SALES = 'daily_sales',
  STOCK_PURCHASE = 'stock_purchase',
  EXPENSE = 'expense',
  INVENTORY = 'inventory',
  INVENTORY_TRANSFER = 'inventory_transfer',
  AUTH = 'auth',
}

@Entity('activity_logs')
@Index(['userId'])
@Index(['entity', 'entityId'])
@Index(['action'])
@Index(['createdAt'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  action: ActivityAction;

  @Column({
    type: 'enum',
    enum: ActivityEntity,
  })
  entity: ActivityEntity;

  @Column({ nullable: true })
  entityId?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  resolvedAt?: Date;
}
